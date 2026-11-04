const mongoose = require("mongoose");
const Car = require("../models/Car");
const Expense = require("../models/Expense");
const { toUSD, carCosts } = require("../services/finance.service");
const { text, longText, num, date, oneOf, id, url, fail, page, pick } = require("../utils/validate");

const CURRENCIES = ["JPY", "USD"];

const EXPENSE_SPEC = {
  category: (v) => oneOf(v, Expense.CATEGORIES),
  amount: (v) => (num(v, { min: 0, max: 1e10 }) ?? undefined),
  currency: (v) => oneOf(v, CURRENCIES),
  amountUSD: (v) => num(v, { min: 0, max: 1e9 }),
  date: (v) => date(v) ?? undefined,
  vendor: (v) => text(v, 120),
  reference: (v) => text(v, 80),
  note: (v) => longText(v, 1000),
  receiptUrl: (v) => (v === "" ? "" : url(v)),
  car: (v) => (v === null || v === "" ? null : id(v)),
};

const PURCHASE_SPEC = {
  price: (v) => num(v, { min: 0, max: 1e10 }),
  currency: (v) => oneOf(v, CURRENCIES),
  priceUSD: (v) => num(v, { min: 0, max: 1e9 }),
  date: (v) => date(v),
  source: (v) => (v === "" || v === null ? null : oneOf(v, ["auction", "dealer", "private", "other"])),
  auctionHouse: (v) => text(v, 80),
  lotNo: (v) => text(v, 40),
  supplier: (v) => text(v, 120),
  note: (v) => longText(v, 1000),
};

const bad = (res, field) => fail(res, `Invalid ${field}.`);

/* GET /api/cars/:id/costs : purchase + expenses + totals + estimated profit */
const getCarCosts = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).select("+purchase make model year price stockNo status").lean();
    if (!car) return fail(res, "Car not found.", 404);
    res.json({ success: true, data: { car: { _id: car._id, make: car.make, model: car.model, year: car.year, price: car.price, stockNo: car.stockNo, status: car.status }, ...(await carCosts(car)) } });
  } catch (err) {
    next(err);
  }
};

/* PUT /api/cars/:id/purchase */
const savePurchase = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, PURCHASE_SPEC);
    if (error) return bad(res, `purchase ${error}`);
    const car = await Car.findById(req.params.id).select("+purchase");
    if (!car) return fail(res, "Car not found.", 404);

    const purchase = { ...(car.purchase?.toObject?.() || {}), ...data };
    for (const k of Object.keys(purchase)) if (purchase[k] === null || purchase[k] === "") delete purchase[k];
    // Price or currency changed without a USD value given: work it out again
    if (("price" in data || "currency" in data) && !(data.priceUSD > 0)) delete purchase.priceUSD;
    if (purchase.price > 0 && !(purchase.priceUSD > 0)) {
      const usd = await toUSD(purchase.price, purchase.currency || "JPY");
      if (usd != null) purchase.priceUSD = usd;
    }
    car.purchase = purchase;
    await car.save();
    const fresh = await Car.findById(car._id).select("+purchase price").lean();
    res.json({ success: true, data: await carCosts(fresh) });
  } catch (err) {
    next(err);
  }
};

/* GET /api/expenses?car=&category=&from=&to= */
const list = async (req, res, next) => {
  try {
    const q = req.query || {};
    const filter = {};
    // ObjectId (not string): the totals aggregate below does not cast types
    if (id(q.car)) filter.car = new mongoose.Types.ObjectId(q.car);
    if (q.car === "none") filter.car = null;
    if (oneOf(q.category, Expense.CATEGORIES)) filter.category = q.category;
    const from = date(q.from), to = date(q.to);
    if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };

    const { limit, skip, page: p } = page(q, 100);
    const [data, total, sum] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate("car", "make model year stockNo").lean(),
      Expense.countDocuments(filter),
      Expense.aggregate([{ $match: filter }, { $group: { _id: null, usd: { $sum: { $ifNull: ["$amountUSD", 0] } } } }]),
    ]);
    res.json({ success: true, data, totalUSD: sum[0]?.usd || 0, pagination: { page: p, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, categories: Expense.CATEGORIES });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, EXPENSE_SPEC);
    if (error) return bad(res, error);
    if (!data.category) return fail(res, "Choose a category.");
    if (!(data.amount > 0)) return fail(res, "Enter an amount greater than 0.");
    if (data.car && !(await Car.exists({ _id: data.car }))) return fail(res, "Car not found.", 404);
    data.currency = data.currency || "JPY";
    data.amountUSD = await toUSD(data.amount, data.currency, data.amountUSD);
    const expense = await Expense.create({ ...data, createdBy: req.admin.id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { data, error } = pick(req.body, EXPENSE_SPEC);
    if (error) return bad(res, error);
    const expense = await Expense.findById(req.params.id);
    if (!expense) return fail(res, "Expense not found.", 404);
    if (data.amount !== undefined && !(data.amount > 0)) return fail(res, "Enter an amount greater than 0.");
    Object.assign(expense, data);
    // Recalculate USD when the amount/currency changed and no USD value was given
    if (("amount" in data || "currency" in data) && !(data.amountUSD > 0)) {
      expense.amountUSD = await toUSD(expense.amount, expense.currency);
    }
    await expense.save();
    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return fail(res, "Expense not found.", 404);
    res.json({ success: true, message: "Expense deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCarCosts, savePurchase, list, create, update, remove };
