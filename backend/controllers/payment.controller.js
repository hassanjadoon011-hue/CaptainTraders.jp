const Car = require("../models/Car");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { toUSD, withBalances, amountDue, round2 } = require("../services/finance.service");
const { markActive } = require("../services/customer.service");
const { text, longText, num, date, oneOf, id, url, escapeRegex, fail, page, pick } = require("../utils/validate");

const METHODS = ["tt", "bank_transfer", "cash", "card", "paypal", "other"];
const STATUSES = ["received", "pending", "refunded"];
const BILLABLE = ["invoiced", "paid", "shipped", "completed"];

const SPEC = {
  amount: (v) => num(v, { min: 0.01, max: 1e10 }) ?? undefined,
  currency: (v) => oneOf(v, ["USD", "JPY"]),
  amountUSD: (v) => num(v, { min: 0, max: 1e9 }),
  method: (v) => oneOf(v, METHODS),
  status: (v) => oneOf(v, STATUSES),
  receivedAt: (v) => date(v) ?? undefined,
  reference: (v) => text(v, 80),
  note: (v) => longText(v, 1000),
  proofUrl: (v) => (v === "" ? "" : url(v)),
};

/* GET /api/payments/balances?status=unpaid|partial|paid&search=  : orders with what is owed */
const balances = async (req, res, next) => {
  try {
    const q = req.query || {};
    const filter = {
      status: { $ne: "cancelled" },
      $or: [{ status: { $in: BILLABLE } }, { "invoice.amount": { $gt: 0 } }],
    };
    const s = text(q.search, 100);
    if (s) {
      const rx = new RegExp(escapeRegex(s), "i");
      filter.$and = [{ $or: [{ "customer.name": rx }, { "customer.email": rx }, { "carInfo.title": rx }, { "invoice.number": rx }, ...(/^\d+$/.test(s) ? [{ orderNo: Number(s) }] : [])] }];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    const all = await withBalances(orders);

    const totals = { due: 0, paid: 0, outstanding: 0, count: { all: all.length, unpaid: 0, partial: 0, paid: 0 } };
    for (const o of all) {
      totals.due += o.finance.due;
      totals.paid += o.finance.paid;
      totals.outstanding += Math.max(0, o.finance.balance);
      if (totals.count[o.finance.status] != null) totals.count[o.finance.status]++;
    }
    for (const k of ["due", "paid", "outstanding"]) totals[k] = round2(totals[k]);

    const status = oneOf(q.status, ["unpaid", "partial", "paid"]);
    const rows = status ? all.filter((o) => o.finance.status === status) : all;
    const { limit, skip, page: p } = page(q);
    res.json({
      success: true,
      data: rows.slice(skip, skip + limit),
      totals,
      pagination: { page: p, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
    });
  } catch (err) {
    next(err);
  }
};

/* GET /api/payments?order=&customer= : payment history */
const list = async (req, res, next) => {
  try {
    const q = req.query || {};
    const filter = {};
    if (id(q.order)) filter.order = q.order;
    if (id(q.customer)) filter.customer = q.customer;
    const { limit, skip, page: p } = page(q, 100);
    const [data, total] = await Promise.all([
      Payment.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(limit)
        .populate("order", "orderNo carInfo.title customer.name").populate("createdBy", "name email").lean(),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: p, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    next(err);
  }
};

/* GET /api/payments/order/:id : one order's balance + payments */
const forOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return fail(res, "Order not found.", 404);
    const [withBal] = await withBalances([order]);
    const payments = await Payment.find({ order: order._id }).sort({ receivedAt: -1 }).populate("createdBy", "name email").lean();
    res.json({ success: true, data: { order: withBal, finance: withBal.finance, payments } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const orderId = id(req.body?.order);
    if (!orderId) return fail(res, "Choose an order.");
    const order = await Order.findById(orderId).lean();
    if (!order) return fail(res, "Order not found.", 404);
    if (order.status === "cancelled") return fail(res, "This order is cancelled.");

    const { data, error } = pick(req.body, SPEC);
    if (error) return fail(res, `Invalid ${error}.`);
    if (!data.amount) return fail(res, "Enter an amount greater than 0.");
    data.currency = data.currency || "USD";
    data.amountUSD = await toUSD(data.amount, data.currency, data.amountUSD);
    if (data.amountUSD == null) return fail(res, "Enter the USD value of this JPY payment (no exchange rate is set).");

    const payment = await Payment.create({ ...data, order: order._id, customer: order.customerRef || null, createdBy: req.admin.id });
    if ((payment.status || "received") === "received") await markActive(order.customerRef);
    const [withBal] = await withBalances([order]);

    // Fully paid: move the order to "paid" and take the car off sale (same as setting Paid by hand)
    let orderStatus = order.status;
    if (withBal.finance.status === "paid" && ["new", "invoiced"].includes(order.status)) {
      await Order.updateOne({ _id: order._id }, { $set: { status: "paid" } });
      if (order.car) await Car.updateOne({ _id: order.car, status: { $ne: "sold" } }, { $set: { status: "sold", soldAt: new Date() } });
      orderStatus = "paid";
    }
    res.status(201).json({ success: true, data: payment, finance: withBal.finance, orderStatus });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, SPEC);
    if (error) return fail(res, `Invalid ${error}.`);
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, "Payment not found.", 404);
    Object.assign(payment, data);
    if (("amount" in data || "currency" in data) && !(data.amountUSD > 0)) {
      payment.amountUSD = await toUSD(payment.amount, payment.currency);
      if (payment.amountUSD == null) return fail(res, "Enter the USD value of this JPY payment.");
    }
    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return fail(res, "Payment not found.", 404);
    res.json({ success: true, message: "Payment deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { balances, list, forOrder, create, update, remove, amountDue };
