const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Message = require("../models/Message");
const Payment = require("../models/Payment");
const Shipment = require("../models/Shipment");
const { withBalances, round2 } = require("../services/finance.service");
const { text, longText, oneOf, id, escapeRegex, fail, page, pick } = require("../utils/validate");

const STATUSES = ["lead", "active", "inactive", "blocked"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const email = (v) => {
  if (v === "" || v === null) return null;
  const e = text(v, 200)?.toLowerCase();
  return e && EMAIL_RX.test(e) ? e : undefined;
};
const tags = (v) =>
  Array.isArray(v) ? [...new Set(v.map((t) => text(t, 30)).filter(Boolean))].slice(0, 20) : undefined;

const SPEC = {
  name: (v) => (text(v, 80)?.length >= 2 ? text(v, 80) : undefined),
  email,
  phone: (v) => text(v, 25) ?? (v === "" ? "" : undefined),
  whatsapp: (v) => text(v, 25),
  company: (v) => text(v, 120),
  country: (v) => text(v, 60),
  city: (v) => text(v, 80),
  address: (v) => text(v, 200),
  deliveryPort: (v) => text(v, 100),
  status: (v) => oneOf(v, STATUSES),
  tags,
  notes: (v) => longText(v, 4000),
  assignedTo: (v) => (v === null || v === "" ? null : id(v)),
};

const LABELS = { name: "Name (at least 2 characters)", email: "Email", status: "Status", assignedTo: "Assigned admin" };
const invalid = (res, field) => fail(res, `Invalid ${LABELS[field] || field}.`);

/* GET /api/customers?search=&status=&country=&page= */
const list = async (req, res, next) => {
  try {
    const q = req.query || {};
    const filter = {};
    const s = text(q.search, 100);
    if (s) {
      const rx = new RegExp(escapeRegex(s), "i");
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }, { country: rx }];
    }
    if (oneOf(q.status, STATUSES)) filter.status = q.status;
    if (text(q.country, 60)) filter.country = new RegExp(`^${escapeRegex(text(q.country, 60))}$`, "i");

    const { limit, skip, page: p } = page(q);
    const [data, total, grouped] = await Promise.all([
      Customer.find(filter).sort({ lastContactAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
      Customer.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);

    // Order counts for this page
    const counts = await Order.aggregate([
      { $match: { customerRef: { $in: data.map((c) => c._id) } } },
      { $group: { _id: "$customerRef", orders: { $sum: 1 }, lastOrderAt: { $max: "$createdAt" } } },
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c]));
    const statusCounts = { all: 0 };
    for (const g of grouped) { statusCounts[g._id] = g.n; statusCounts.all += g.n; }

    res.json({
      success: true,
      data: data.map((c) => ({ ...c, orderCount: byId[String(c._id)]?.orders || 0, lastOrderAt: byId[String(c._id)]?.lastOrderAt || null })),
      pagination: { page: p, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      counts: statusCounts,
    });
  } catch (err) {
    next(err);
  }
};

/* GET /api/customers/match?email= : is this email already a customer? */
const match = async (req, res, next) => {
  try {
    const e = email(req.query.email);
    if (!e) return fail(res, "Enter a valid email address.");
    const customer = await Customer.findOne({ email: e }).lean();
    res.json({ success: true, data: customer || null });
  } catch (err) {
    next(err);
  }
};

/* GET /api/customers/:id : profile + history */
const get = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("assignedTo", "name email").lean();
    if (!customer) return fail(res, "Customer not found.", 404);

    const canFinance = req.admin.permissions.includes("finance.view");
    const [orders, messages, shipments, payments] = await Promise.all([
      Order.find({ customerRef: customer._id }).sort({ createdAt: -1 }).limit(100).lean(),
      Message.find({ customerRef: customer._id }).sort({ createdAt: -1 }).limit(50).lean(),
      Shipment.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(50).lean(),
      canFinance ? Payment.find({ customer: customer._id }).sort({ receivedAt: -1 }).limit(100).lean() : [],
    ]);

    const ordersOut = canFinance ? await withBalances(orders) : orders;
    const summary = {
      orders: orders.filter((o) => o.type === "order").length,
      inquiries: orders.filter((o) => o.type === "inquiry").length,
      messages: messages.length,
      shipments: shipments.length,
    };
    if (canFinance) {
      summary.totalDue = round2(ordersOut.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.finance.due, 0));
      summary.totalPaid = round2(payments.filter((p) => p.status === "received").reduce((s, p) => s + (p.amountUSD || 0), 0));
      // Owed = invoiced (or partly paid) orders that are not cancelled
      const billable = (o) =>
        o.status !== "cancelled" && (o.finance.paid > 0 || ["invoiced", "paid", "shipped", "completed"].includes(o.status));
      summary.outstanding = round2(ordersOut.filter(billable).reduce((s, o) => s + Math.max(0, o.finance.balance), 0));
    }

    res.json({ success: true, data: { customer, orders: ordersOut, messages, shipments, payments, summary } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, SPEC);
    if (error) return invalid(res, error);
    if (!data.name) return fail(res, "Name is required.");
    if (data.email && (await Customer.exists({ email: data.email }))) {
      return fail(res, "A customer with this email already exists.", 409);
    }
    const customer = await Customer.create({ ...data, source: "manual" });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err?.code === 11000) return fail(res, "A customer with this email already exists.", 409);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, SPEC);
    if (error) return invalid(res, error);
    if (!Object.keys(data).length) return fail(res, "Nothing to update.");
    if (data.email && (await Customer.exists({ email: data.email, _id: { $ne: req.params.id } }))) {
      return fail(res, "Another customer already uses this email.", 409);
    }
    const unset = {};
    if (data.email === null) { delete data.email; unset.email = 1; }
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: data, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true }
    ).lean();
    if (!customer) return fail(res, "Customer not found.", 404);
    res.json({ success: true, data: customer });
  } catch (err) {
    if (err?.code === 11000) return fail(res, "Another customer already uses this email.", 409);
    next(err);
  }
};

// Deleting a customer only unlinks their records; orders and messages stay
const remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id).lean();
    if (!customer) return fail(res, "Customer not found.", 404);
    const ref = customer._id;
    await Promise.all([
      Order.updateMany({ customerRef: ref }, { $set: { customerRef: null } }),
      Message.updateMany({ customerRef: ref }, { $set: { customerRef: null } }),
      Payment.updateMany({ customer: ref }, { $set: { customer: null } }),
      Shipment.updateMany({ customer: ref }, { $set: { customer: null } }),
    ]);
    res.json({ success: true, message: "Customer deleted. Their orders and messages were kept." });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, match, get, create, update, remove, STATUSES };
