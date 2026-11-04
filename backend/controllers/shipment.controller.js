const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const { text, longText, num, date, oneOf, id, url, escapeRegex, fail, page, pick } = require("../utils/validate");

const DOC_TYPES = ["bill_of_lading", "export_certificate", "invoice", "inspection", "insurance", "other"];

const SPEC = {
  status: (v) => oneOf(v, Shipment.STATUSES),
  method: (v) => oneOf(v, ["roro", "container"]),
  shippingLine: (v) => text(v, 80),
  vessel: (v) => text(v, 80),
  voyage: (v) => text(v, 40),
  bookingNo: (v) => text(v, 60),
  blNo: (v) => text(v, 60),
  containerNo: (v) => text(v, 40),
  portOfLoading: (v) => text(v, 80),
  portOfDischarge: (v) => text(v, 80),
  destinationCountry: (v) => text(v, 60),
  etd: (v) => date(v),
  eta: (v) => date(v),
  departedAt: (v) => date(v),
  arrivedAt: (v) => date(v),
  deliveredAt: (v) => date(v),
  freightCost: (v) => num(v, { min: 0, max: 1e8 }),
  note: (v) => longText(v, 2000),
};

// Status -> timestamp filled automatically the first time
const STAMP = { departed: "departedAt", arrived: "arrivedAt", delivered: "deliveredAt" };
const AFTER_DEPARTURE = ["departed", "arrived", "cleared", "delivered"];

// Keep the order status in step with the ship (only for paid orders)
const syncOrder = async (shipment) => {
  if (AFTER_DEPARTURE.includes(shipment.status)) {
    await Order.updateOne({ _id: shipment.order, status: "paid" }, { $set: { status: "shipped" } });
  }
  if (shipment.status === "delivered") {
    await Order.updateOne({ _id: shipment.order, status: { $in: ["paid", "shipped"] } }, { $set: { status: "completed" } });
  }
};

const populate = (q) =>
  q.populate("order", "orderNo status type carInfo customer.name customer.country").populate("customer", "name email country");

/* GET /api/shipments?status=&search= */
const list = async (req, res, next) => {
  try {
    const q = req.query || {};
    const filter = {};
    if (oneOf(q.status, Shipment.STATUSES)) filter.status = q.status;
    const s = text(q.search, 80);
    if (s) {
      const rx = new RegExp(escapeRegex(s), "i");
      const orderIds = await Order.find({ $or: [{ "customer.name": rx }, { "carInfo.title": rx }, ...(/^\d+$/.test(s) ? [{ orderNo: Number(s) }] : [])] }).distinct("_id");
      filter.$or = [{ vessel: rx }, { blNo: rx }, { bookingNo: rx }, { containerNo: rx }, { portOfDischarge: rx }, { order: { $in: orderIds } }];
    }
    const { limit, skip, page: p } = page(q);
    const [data, total, grouped] = await Promise.all([
      populate(Shipment.find(filter).sort({ eta: 1, createdAt: -1 }).skip(skip).limit(limit)).lean(),
      Shipment.countDocuments(filter),
      Shipment.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    const counts = { all: 0 };
    for (const g of grouped) { counts[g._id] = g.n; counts.all += g.n; }
    res.json({ success: true, data, counts, pagination: { page: p, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const shipment = await populate(Shipment.findById(req.params.id)).lean();
    if (!shipment) return fail(res, "Shipment not found.", 404);
    res.json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

/* GET /api/shipments/order/:id : the shipment of an order (or null) */
const forOrder = async (req, res, next) => {
  try {
    res.json({ success: true, data: await Shipment.findOne({ order: req.params.id }).lean() });
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
    if (await Shipment.exists({ order: order._id })) return fail(res, "This order already has a shipment.", 409);

    const { data, error } = pick(req.body, SPEC);
    if (error) return fail(res, `Invalid ${error}.`);
    for (const [st, field] of Object.entries(STAMP)) if (data.status === st && !data[field]) data[field] = new Date();

    const shipment = await Shipment.create({
      portOfDischarge: order.destination?.port || order.customer?.deliveryPlace,
      destinationCountry: order.destination?.country || order.customer?.country,
      ...data,
      order: order._id,
      car: order.car || null,
      customer: order.customerRef || null,
    });
    await syncOrder(shipment);
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    if (err?.code === 11000) return fail(res, "This order already has a shipment.", 409);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, SPEC);
    if (error) return fail(res, `Invalid ${error}.`);
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return fail(res, "Shipment not found.", 404);
    Object.assign(shipment, data);
    const field = STAMP[shipment.status];
    if (field && !shipment[field]) shipment[field] = new Date();
    await shipment.save();
    await syncOrder(shipment);
    res.json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) return fail(res, "Shipment not found.", 404);
    res.json({ success: true, message: "Shipment deleted." });
  } catch (err) {
    next(err);
  }
};

/* POST /api/shipments/:id/documents { type, name, url } */
const addDocument = async (req, res, next) => {
  try {
    const link = url(req.body?.url);
    if (!link) return fail(res, "Enter a valid https:// link to the document.");
    const doc = { type: oneOf(req.body?.type, DOC_TYPES) || "other", name: text(req.body?.name, 120) || "", url: link };
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, { $push: { documents: doc } }, { new: true, runValidators: true }).lean();
    if (!shipment) return fail(res, "Shipment not found.", 404);
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

const removeDocument = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, { $pull: { documents: { _id: req.params.docId } } }, { new: true }).lean();
    if (!shipment) return fail(res, "Shipment not found.", 404);
    res.json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, get, forOrder, create, update, remove, addDocument, removeDocument };
