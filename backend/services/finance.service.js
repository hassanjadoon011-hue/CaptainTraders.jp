const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const { getConfig } = require("./pricing.service");

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// What the customer owes for an order (USD): invoice > saved quote > FOB price
const amountDue = (order) => {
  if (order?.invoice?.amount > 0) return round2(order.invoice.amount);
  if (order?.quote?.available && order.quote.total > 0) return round2(order.quote.total);
  return round2(order?.carInfo?.fobPrice || 0);
};

const paymentStatus = (due, paid) => {
  if (paid <= 0) return due > 0 ? "unpaid" : "none";
  return paid + 0.009 >= due ? "paid" : "partial";
};

// Convert JPY to USD with the admin's exchange rate (Shipping settings)
const toUSD = async (amount, currency, given) => {
  if (currency === "USD") return round2(amount);
  if (given > 0) return round2(given);
  const rate = Number((await getConfig()).usdToJpy) || 0;
  return rate > 0 ? round2(amount / rate) : null;
};

// { orderId: paidUSD } for received payments
const paidByOrder = async (orderIds) => {
  if (!orderIds.length) return {};
  const rows = await Payment.aggregate([
    { $match: { order: { $in: orderIds.map((i) => new mongoose.Types.ObjectId(String(i))) }, status: "received" } },
    { $group: { _id: "$order", paid: { $sum: { $ifNull: ["$amountUSD", 0] } }, n: { $sum: 1 }, last: { $max: "$receivedAt" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { paid: round2(r.paid), count: r.n, lastPaymentAt: r.last }]));
};

// Adds { due, paid, balance, paymentStatus } to each order
const withBalances = async (orders) => {
  const paid = await paidByOrder(orders.map((o) => o._id));
  return orders.map((o) => {
    const due = amountDue(o);
    const p = paid[String(o._id)] || { paid: 0, count: 0, lastPaymentAt: null };
    return { ...o, finance: { due, paid: p.paid, balance: round2(due - p.paid), payments: p.count, lastPaymentAt: p.lastPaymentAt, status: paymentStatus(due, p.paid) } };
  });
};

// Total cost of a car in USD: purchase + all linked expenses
const carCosts = async (car) => {
  const expenses = await Expense.find({ car: car._id }).sort({ date: -1 }).lean();
  const purchaseUSD = car.purchase?.priceUSD ?? (car.purchase?.currency === "USD" ? car.purchase?.price : null);
  const expensesUSD = round2(expenses.reduce((s, e) => s + (e.amountUSD || 0), 0));
  const missingUSD = expenses.filter((e) => e.amountUSD == null).length + (car.purchase?.price && purchaseUSD == null ? 1 : 0);
  const totalCostUSD = round2((purchaseUSD || 0) + expensesUSD);
  return {
    purchase: car.purchase || null,
    expenses,
    totals: {
      purchaseUSD: purchaseUSD == null ? null : round2(purchaseUSD),
      expensesUSD,
      totalCostUSD,
      priceUSD: round2(car.price || 0),
      estimatedProfitUSD: round2((car.price || 0) - totalCostUSD),
      missingUSD, // items without a USD value (not counted)
    },
  };
};

module.exports = { round2, amountDue, paymentStatus, toUSD, paidByOrder, withBalances, carCosts };
