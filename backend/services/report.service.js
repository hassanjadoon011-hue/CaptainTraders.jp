// Business reports. All money in USD, from actual records.
//
// Counting rules (no double counting):
// - Revenue  = payments with status "received" (by receivedAt). "refunded" payments are
//              money returned: reported as refunds, never as revenue. "pending" is ignored.
// - Purchase = Car.purchase.priceUSD (by purchase date, else the car's created date).
// - Expenses = Expense.amountUSD (by date). A "purchase" expense on a car that already
//              has Car.purchase.price is the same cost entered twice, so it is skipped.
//              Shipment.freightCost is informational only (freight is counted via Expenses).
const Car = require("../models/Car");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const Shipment = require("../models/Shipment");
const { withBalances, round2 } = require("./finance.service");

const TZ = "Asia/Tokyo";
const FORMATS = { day: "%Y-%m-%d", month: "%Y-%m", year: "%Y" };
const DAY = 86400000;

// Expenses that count (skip duplicate "purchase" entries of cars with a purchase price)
const countedExpensesPipeline = (match) => [
  { $match: match },
  { $lookup: { from: "cars", localField: "car", foreignField: "_id", as: "c", pipeline: [{ $project: { p: "$purchase.price" } }] } },
  { $match: { $nor: [{ category: "purchase", "c.p": { $gt: 0 } }] } },
];

// Period keys between two dates (inclusive), in Tokyo time
const periodKeys = (from, to, group) => {
  const keys = [];
  const fmt = (d) => {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    return group === "year" ? p.slice(0, 4) : group === "month" ? p.slice(0, 7) : p;
  };
  const step = group === "day" ? DAY : group === "month" ? 27 * DAY : 360 * DAY;
  for (let t = from.getTime(); t <= to.getTime() + step; t += step) {
    const k = fmt(new Date(Math.min(t, to.getTime())));
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
};

/* 1) Revenue, expenses and profit per day / month / year */
const profitAndLoss = async ({ from, to, group = "month" }) => {
  const fmt = FORMATS[group] || FORMATS.month;
  const key = (field) => ({ $dateToString: { format: fmt, date: field, timezone: TZ } });
  const range = { $gte: from, $lte: to };

  const [pay, exp, pur, byCategory] = await Promise.all([
    Payment.aggregate([
      { $match: { receivedAt: range, status: { $in: ["received", "refunded"] } } },
      { $group: { _id: { k: key("$receivedAt"), s: "$status" }, usd: { $sum: { $ifNull: ["$amountUSD", 0] } }, n: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      ...countedExpensesPipeline({ date: range }),
      { $group: { _id: key("$date"), usd: { $sum: { $ifNull: ["$amountUSD", 0] } }, missing: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$amountUSD", null] }, null] }, 1, 0] } } } },
    ]),
    Car.aggregate([
      { $match: { "purchase.price": { $gt: 0 } } },
      { $addFields: { pd: { $ifNull: ["$purchase.date", "$createdAt"] } } },
      { $match: { pd: range } },
      { $group: { _id: key("$pd"), usd: { $sum: { $ifNull: ["$purchase.priceUSD", 0] } }, n: { $sum: 1 }, missing: { $sum: { $cond: [{ $gt: ["$purchase.priceUSD", 0] }, 0, 1] } } } },
    ]),
    Expense.aggregate([
      ...countedExpensesPipeline({ date: range }),
      { $group: { _id: "$category", usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } },
      { $sort: { usd: -1 } },
    ]),
  ]);

  const rows = new Map(periodKeys(from, to, group).map((k) => [k, { period: k, revenue: 0, refunds: 0, payments: 0, purchases: 0, carsBought: 0, expenses: 0 }]));
  const row = (k) => rows.get(k) || rows.set(k, { period: k, revenue: 0, refunds: 0, payments: 0, purchases: 0, carsBought: 0, expenses: 0 }).get(k);
  for (const p of pay) {
    const r = row(p._id.k);
    if (p._id.s === "received") { r.revenue += p.usd; r.payments += p.n; } else r.refunds += p.usd;
  }
  let missingUSD = 0;
  for (const e of exp) { row(e._id).expenses += e.usd; missingUSD += e.missing; }
  for (const c of pur) { const r = row(c._id); r.purchases += c.usd; r.carsBought += c.n; missingUSD += c.missing; }

  const series = [...rows.values()].sort((a, b) => a.period.localeCompare(b.period)).map((r) => {
    const costs = r.purchases + r.expenses;
    return { ...r, revenue: round2(r.revenue), refunds: round2(r.refunds), purchases: round2(r.purchases), expenses: round2(r.expenses), costs: round2(costs), profit: round2(r.revenue - costs) };
  });
  const sum = (k) => round2(series.reduce((s, r) => s + r[k], 0));
  const totals = { revenue: sum("revenue"), refunds: sum("refunds"), purchases: sum("purchases"), expenses: sum("expenses"), costs: sum("costs"), profit: sum("profit"), payments: sum("payments"), carsBought: sum("carsBought") };
  totals.margin = totals.revenue > 0 ? round2((totals.profit / totals.revenue) * 100) : null;

  return { group, from, to, series, totals, byCategory: byCategory.map((c) => ({ category: c._id, usd: round2(c.usd) })), missingUSD };
};

/* 2) Profit and loss per vehicle and per make (all time, actual records) */
const vehicleProfit = async ({ status = "sold" } = {}) => {
  const filter = status === "all" ? {} : status === "available" ? { status: { $ne: "sold" } } : { status: "sold" };
  const cars = await Car.find(filter).select("+purchase make model year stockNo price status soldAt createdAt").lean();
  const ids = cars.map((c) => c._id);

  const [expenses, orders] = await Promise.all([
    Expense.aggregate([
      ...countedExpensesPipeline({ car: { $in: ids } }),
      { $group: { _id: "$car", usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } },
    ]),
    Order.find({ car: { $in: ids }, status: { $ne: "cancelled" } }).select("_id car").lean(),
  ]);
  const orderCar = Object.fromEntries(orders.map((o) => [String(o._id), String(o.car)]));
  const paid = await Payment.aggregate([
    { $match: { order: { $in: orders.map((o) => o._id) }, status: "received" } },
    { $group: { _id: "$order", usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } },
  ]);

  const expByCar = Object.fromEntries(expenses.map((e) => [String(e._id), e.usd]));
  const revByCar = {};
  for (const p of paid) {
    const car = orderCar[String(p._id)];
    revByCar[car] = (revByCar[car] || 0) + p.usd;
  }

  const rows = cars.map((c) => {
    const purchase = round2(c.purchase?.priceUSD || 0);
    const expensesUSD = round2(expByCar[String(c._id)] || 0);
    const cost = round2(purchase + expensesUSD);
    const revenue = round2(revByCar[String(c._id)] || 0);
    return {
      _id: c._id, stockNo: c.stockNo, title: [c.year, c.make, c.model].filter(Boolean).join(" "), make: c.make || "Other",
      status: c.status || "available", soldAt: c.soldAt, listPrice: round2(c.price || 0),
      purchase, expenses: expensesUSD, cost, revenue,
      profit: round2(revenue - cost),
      margin: revenue > 0 ? round2(((revenue - cost) / revenue) * 100) : null,
      costMissing: !!(c.purchase?.price && !c.purchase?.priceUSD) || !c.purchase?.price,
    };
  }).sort((a, b) => b.profit - a.profit);

  const makes = new Map();
  for (const r of rows) {
    const m = makes.get(r.make) || { make: r.make, cars: 0, revenue: 0, cost: 0, profit: 0 };
    m.cars++; m.revenue += r.revenue; m.cost += r.cost; m.profit += r.profit;
    makes.set(r.make, m);
  }
  const byMake = [...makes.values()].map((m) => ({ ...m, revenue: round2(m.revenue), cost: round2(m.cost), profit: round2(m.profit), avgProfit: round2(m.profit / m.cars) })).sort((a, b) => b.profit - a.profit);
  const totals = { cars: rows.length, revenue: round2(rows.reduce((s, r) => s + r.revenue, 0)), cost: round2(rows.reduce((s, r) => s + r.cost, 0)) };
  totals.profit = round2(totals.revenue - totals.cost);
  return { status, vehicles: rows, byMake, totals, missingCost: rows.filter((r) => r.costMissing).length };
};

/* 3) Country-wise requests, conversion and revenue */
const countries = async ({ from, to }) => {
  const match = { createdAt: { $gte: from, $lte: to } };
  const rows = await Order.aggregate([
    { $match: match },
    { $addFields: { country: { $ifNull: [{ $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$destination.country", ""] } }, 0] }, "$destination.country", "$customer.country"] }, "Unknown"] } } },
    { $addFields: { country: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$country", ""] } }, 0] }, "$country", "Unknown"] } } },
    { $lookup: { from: "payments", localField: "_id", foreignField: "order", as: "p", pipeline: [{ $match: { status: "received" } }, { $group: { _id: null, usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } }] } },
    {
      $group: {
        _id: { $toLower: "$country" },
        name: { $first: "$country" },
        requests: { $sum: 1 },
        inquiries: { $sum: { $cond: [{ $eq: ["$type", "inquiry"] }, 1, 0] } },
        orders: { $sum: { $cond: [{ $eq: ["$type", "order"] }, 1, 0] } },
        won: { $sum: { $cond: [{ $in: ["$status", ["paid", "shipped", "completed"]] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        revenue: { $sum: { $ifNull: [{ $first: "$p.usd" }, 0] } },
      },
    },
    { $sort: { requests: -1 } },
  ]);
  const data = rows.map((r) => ({ country: r.name, requests: r.requests, inquiries: r.inquiries, orders: r.orders, won: r.won, cancelled: r.cancelled, revenue: round2(r.revenue), conversion: r.requests ? round2((r.won / r.requests) * 100) : 0 }));
  const totals = data.reduce((t, r) => ({ requests: t.requests + r.requests, won: t.won + r.won, revenue: round2(t.revenue + r.revenue) }), { requests: 0, won: 0, revenue: 0 });
  totals.conversion = totals.requests ? round2((totals.won / totals.requests) * 100) : 0;
  return { from, to, countries: data, totals };
};

/* 4) Unsold vehicle aging and inventory value */
const BUCKETS = [[0, 30, "0–30 days"], [31, 60, "31–60 days"], [61, 90, "61–90 days"], [91, 180, "91–180 days"], [181, Infinity, "Over 180 days"]];
const inventory = async () => {
  const cars = await Car.find({ status: { $ne: "sold" } }).select("+purchase make model year stockNo price createdAt views m3").lean();
  const exp = await Expense.aggregate([
    ...countedExpensesPipeline({ car: { $in: cars.map((c) => c._id) } }),
    { $group: { _id: "$car", usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } },
  ]);
  const expByCar = Object.fromEntries(exp.map((e) => [String(e._id), e.usd]));
  const now = Date.now();
  const vehicles = cars.map((c) => {
    const inStock = new Date(c.purchase?.date || c.createdAt);
    const days = Math.max(0, Math.floor((now - inStock.getTime()) / DAY));
    const cost = round2((c.purchase?.priceUSD || 0) + (expByCar[String(c._id)] || 0));
    return { _id: c._id, stockNo: c.stockNo, title: [c.year, c.make, c.model].filter(Boolean).join(" "), make: c.make, days, since: inStock, listPrice: round2(c.price || 0), cost, expectedProfit: round2((c.price || 0) - cost), views: c.views || 0, bucket: BUCKETS.find(([a, b]) => days >= a && days <= b)[2] };
  }).sort((a, b) => b.days - a.days);
  const buckets = BUCKETS.map(([, , label]) => {
    const list = vehicles.filter((v) => v.bucket === label);
    return { label, cars: list.length, listValue: round2(list.reduce((s, v) => s + v.listPrice, 0)), cost: round2(list.reduce((s, v) => s + v.cost, 0)) };
  });
  const totals = { cars: vehicles.length, listValue: round2(vehicles.reduce((s, v) => s + v.listPrice, 0)), cost: round2(vehicles.reduce((s, v) => s + v.cost, 0)), avgDays: vehicles.length ? Math.round(vehicles.reduce((s, v) => s + v.days, 0) / vehicles.length) : 0 };
  return { vehicles, buckets, totals };
};

/* 5) Outstanding customer payments + upcoming shipment arrivals */
const receivables = async ({ days = 30 } = {}) => {
  const orders = await Order.find({
    status: { $ne: "cancelled" },
    $or: [{ status: { $in: ["invoiced", "paid", "shipped", "completed"] } }, { "invoice.amount": { $gt: 0 } }],
  }).sort({ createdAt: 1 }).lean();
  const now = new Date();
  const owing = (await withBalances(orders))
    .filter((o) => o.finance.balance > 0.009)
    .map((o) => ({
      _id: o._id, orderNo: o.orderNo, invoiceNo: o.invoice?.number || "", customer: o.customer?.name || "", country: o.customer?.country || "",
      vehicle: o.carInfo?.title || "", status: o.status, due: o.finance.due, paid: o.finance.paid, balance: o.finance.balance,
      dueAt: o.invoice?.dueAt || null,
      daysOverdue: o.invoice?.dueAt && new Date(o.invoice.dueAt) < now ? Math.floor((now - new Date(o.invoice.dueAt)) / DAY) : 0,
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.balance - a.balance);

  const until = new Date(now.getTime() + days * DAY);
  const arrivals = await Shipment.find({ status: { $nin: ["arrived", "cleared", "delivered", "cancelled"] }, eta: { $ne: null, $lte: until } })
    .sort({ eta: 1 }).populate("order", "orderNo customer.name carInfo.title").lean();

  return {
    outstanding: owing,
    outstandingTotal: round2(owing.reduce((s, o) => s + o.balance, 0)),
    overdueTotal: round2(owing.filter((o) => o.daysOverdue > 0).reduce((s, o) => s + o.balance, 0)),
    arrivals: arrivals.map((s) => ({
      _id: s._id, orderNo: s.order?.orderNo, customer: s.order?.customer?.name || "", vehicle: s.order?.carInfo?.title || "",
      vessel: s.vessel || "", blNo: s.blNo || "", portOfDischarge: s.portOfDischarge || "", eta: s.eta, status: s.status,
      daysToArrival: Math.ceil((new Date(s.eta) - now) / DAY),
    })),
    days,
  };
};

module.exports = { profitAndLoss, vehicleProfit, countries, inventory, receivables, periodKeys };
