const mongoose = require("mongoose");
const Car = require("../models/Car");
const Order = require("../models/Order");
const Counter = require("../models/Counter");
const { calculateQuote } = require("../services/pricing.service");
const { upsertFromContact, markActive } = require("../services/customer.service");

const STATUSES = ["new", "invoiced", "paid", "shipped", "completed", "cancelled"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RX = /^[+\d][\d\s\-()]{5,19}$/;

const text = (v, max = 200) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
const longText = (v, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";
const str = (v) => (typeof v === "string" ? v.trim() : "");
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (res, message, code = 400) =>
  res.status(code).json({ success: false, message });

const nextOrderNo = async () => {
  const c = await Counter.findOneAndUpdate(
    { _id: "orderNo" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return 1000 + c.seq;
};

/* ───────── PUBLIC: send an inquiry or place an order ───────── */
const create = async (req, res, next) => {
  try {
    const b = req.body || {};

    // Hidden field that only bots fill in
    if (b.website) {
      return res.status(201).json({ success: true, data: { orderNo: 0, type: "inquiry" } });
    }

    const customer = {
      name:          text(b.name, 80),
      email:         text(b.email, 120).toLowerCase(),
      country:       text(b.country, 60),
      deliveryPlace: text(b.deliveryPlace, 100),
      address:       text(b.address, 200),
      city:          text(b.city, 80),
      tel:           text(b.tel, 25),
    };

    if (customer.name.length < 2)        return fail(res, "Please enter your name.");
    if (!EMAIL_RX.test(customer.email))  return fail(res, "Please enter a valid email address.");
    if (customer.country.length < 2)     return fail(res, "Please enter your country.");
    if (!customer.deliveryPlace)         return fail(res, "Please enter the delivery place.");
    if (!customer.address)               return fail(res, "Please enter your address.");
    if (!customer.city)                  return fail(res, "Please enter your city.");
    if (!TEL_RX.test(customer.tel))      return fail(res, "Please enter a valid phone number.");

    const type = b.type === "order" ? "order" : "inquiry";
    if (type === "order" && b.agreed !== true) {
      return fail(res, "Please accept the vehicle purchase agreement to place an order.");
    }

    if (!mongoose.Types.ObjectId.isValid(b.carId)) return fail(res, "Invalid car.");
    const car = await Car.findById(b.carId).lean();
    if (!car) return fail(res, "This vehicle was not found.", 404);
    if (car.status === "sold") {
      return fail(res, "Sorry, this vehicle has just been sold.", 409);
    }

    // Price estimate for the chosen destination (worked out here, not by the browser)
    let destination;
    let quote;
    const dCountry = text(b.destination?.country, 60);
    const dPort = text(b.destination?.port, 60);
    if (dCountry) {
      destination = {
        country: dCountry,
        port: dPort,
        insurance: isTrue(b.destination.insurance),
        inspection: isTrue(b.destination.inspection),
      };
      const q = await calculateQuote({ car, ...destination });
      quote = {
        available: q.available,
        fob: q.fob,
        freight: q.freight,
        freightMethod: q.freightMethod,
        m3: q.m3,
        ratePerM3: q.ratePerM3,
        insurance: q.insurance,
        inspection: q.inspection,
        total: q.total,
      };
    }

    // Link to the CRM record. A CRM problem must never lose the customer's request.
    let customerRef = null;
    try {
      customerRef = (await upsertFromContact(customer, type))?._id || null;
    } catch (err) {
      console.error("CRM link failed:", err.message);
    }

    const orderNo = await nextOrderNo();
    const order = await Order.create({
      orderNo,
      type,
      car: car._id,
      carInfo: {
        stockNo:  car.stockNo,
        title:    [car.year, car.make, car.model].filter(Boolean).join(" "),
        year:     car.year,
        image:    car.images?.[0],
        fobPrice: car.price,
      },
      customer,
      customerRef,
      destination,
      quote,
      message: longText(b.message),
    });

    res.status(201).json({ success: true, data: { orderNo: order.orderNo, type: order.type } });
  } catch (err) {
    next(err);
  }
};

/* ───────── ADMIN ───────── */
const list = async (req, res, next) => {
  try {
    const q = req.query || {};
    const base = {};

    const type = str(q.type);
    if (type === "order" || type === "inquiry") base.type = type;

    const search = str(q.search);
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      base.$or = [
        { "customer.name": rx },
        { "customer.email": rx },
        { "customer.country": rx },
        { "carInfo.title": rx },
      ];
      if (/^\d+$/.test(search)) base.$or.push({ orderNo: Number(search) });
    }

    const filter = { ...base };
    const status = str(q.status);
    if (STATUSES.includes(status)) filter.status = status;

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(q.limit) || 10));

    const [data, total, grouped] = await Promise.all([
      Order.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([{ $match: base }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);

    const counts = { all: 0 };
    for (const g of grouped) {
      counts[g._id] = g.n;
      counts.all += g.n;
    }

    res.json({
      success: true,
      data,
      counts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const b = req.body || {};
    const set = {};

    if ("status" in b) {
      if (!STATUSES.includes(b.status)) return fail(res, "Invalid status.");
      set.status = b.status;
    }
    if ("adminNote" in b) set.adminNote = longText(b.adminNote);
    if ("isRead" in b) set.isRead = isTrue(b.isRead);

    if (Object.keys(set).length === 0) return fail(res, "Nothing to update.");

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: set },
      { new: true, runValidators: true }
    ).lean();
    if (!order) return fail(res, "Order not found.", 404);

    // Once an order is paid, the car is no longer for sale
    let carMarkedSold = false;
    if (["paid", "shipped", "completed"].includes(order.status) && order.car) {
      const r = await Car.updateOne(
        { _id: order.car, status: { $ne: "sold" } },
        { $set: { status: "sold", soldAt: new Date() } }
      );
      carMarkedSold = r.modifiedCount > 0;
      await markActive(order.customerRef);
    }

    res.json({ success: true, data: order, carMarkedSold });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return fail(res, "Order not found.", 404);
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, update, remove };