const Car = require("../models/Car");
const Counter = require("../models/Counter");

const SORT_MAP = {
  newest:       "-createdAt",
  oldest:       "createdAt",
  price_asc:    "price",
  price_desc:   "-price",
  year_desc:    "-year",
  year_asc:     "year",
  mileage_asc:  "mileage",
  popular:      "-views",
};

// Only these fields can be saved from the browser
const ALLOWED_FIELDS = [
  "make", "model", "year", "price", "originalPrice", "mileage",
  "engine", "engineCode", "power", "transmission", "fuelType", "drivetrain",
  "bodyType", "vehicleType", "steering", "color", "condition",
  "vin", "modelCode", "regYear", "regMonth", "mfgYear", "mfgMonth",
  "seats", "doors", "m3", "features", "description", "location",
  "isFeatured", "isNew", "isRecommended", "isBestDeal", "status", "images",
];

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query-string helpers: ignore anything that is not a plain, non-empty string
const str = (v) => (typeof v === "string" ? v.trim() : "");
const num = (v) => {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const exact = (v) => new RegExp(`^${escapeRegex(v)}$`, "i");

// "toyota" -> "Toyota". Names typed with capitals (BMW) are left alone
const tidyName = (s) =>
  s === s.toLowerCase() ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : s;

const cleanPayload = (data = {}, isCreate = false) => {
  const out = {};

  for (const key of ALLOWED_FIELDS) {
    if (!(key in data)) continue;
    let v = data[key];
    if (typeof v === "string") v = v.trim();
    if (v === "") {
      if (!isCreate) out[key] = null; // empty field on edit clears the value
      continue;
    }
    out[key] = v;
  }

  if (!out.status) delete out.status;
  if (typeof out.make === "string") out.make = tidyName(out.make);

  if ("features" in out) {
    out.features = Array.isArray(out.features)
      ? out.features.map((s) => String(s).trim()).filter(Boolean).slice(0, 40)
      : [];
  }
  if ("images" in out) {
    out.images = Array.isArray(out.images)
      ? out.images.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u)).slice(0, 40)
      : [];
  }

  return out;
};

const nextStockNo = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "stockNo" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const getAllCars = async (query = {}) => {
  const filter = {};

  const make         = str(query.make);
  const model        = str(query.model);
  const fuelType     = str(query.fuelType);
  const bodyType     = str(query.bodyType);
  const vehicleType  = str(query.vehicleType);
  const steering     = str(query.steering);
  const transmission = str(query.transmission);
  const drivetrain   = str(query.drivetrain);
  const color        = str(query.color);
  const location     = str(query.location);
  const condition    = str(query.condition);

  if (make)         filter.make         = exact(make);
  if (model)        filter.model        = exact(model);
  if (fuelType)     filter.fuelType     = exact(fuelType);
  if (bodyType)     filter.bodyType     = exact(bodyType);
  if (transmission) filter.transmission = exact(transmission);
  if (drivetrain)   filter.drivetrain   = exact(drivetrain);
  if (color)        filter.color        = exact(color);
  if (location)     filter.location     = exact(location);
  if (condition)    filter.condition    = exact(condition);
  if (vehicleType)  filter.vehicleType  = vehicleType;
  if (steering)     filter.steering     = exact(steering);

  // Year: exact year, or a from/to range
  const yearExact = num(query.year);
  const yearFrom  = num(query.yearFrom) ?? yearExact;
  const yearTo    = num(query.yearTo)   ?? yearExact;
  if (yearFrom !== undefined || yearTo !== undefined) {
    filter.year = {
      ...(yearFrom !== undefined && { $gte: yearFrom }),
      ...(yearTo   !== undefined && { $lte: yearTo }),
    };
  }

  const minPrice = num(query.minPrice);
  const maxPrice = num(query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice }),
    };
  }

  const minMileage = num(query.minMileage);
  const maxMileage = num(query.maxMileage);
  if (minMileage !== undefined || maxMileage !== undefined) {
    filter.mileage = {
      ...(minMileage !== undefined && { $gte: minMileage }),
      ...(maxMileage !== undefined && { $lte: maxMileage }),
    };
  }

  if (str(query.recommend) === "1") filter.isRecommended = true;
  if (str(query.bestDeals) === "1") filter.isBestDeal = true;

  // status=available -> everything not sold (also old cars without a status)
  const status = str(query.status);
  if (status === "available") filter.status = { $ne: "sold" };
  if (status === "sold")      filter.status = "sold";

  // Text search: make, model, chassis number, or stock number
  const search = str(query.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ make: rx }, { model: rx }, { vin: rx }];
    if (/^\d+$/.test(search)) filter.$or.push({ stockNo: Number(search) });
  }

  const pageNum   = Math.max(1, Number(query.page) || 1);
  const limitNum  = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip      = (pageNum - 1) * limitNum;
  const mongoSort = SORT_MAP[str(query.sort)] || "-createdAt";

  const [data, totalCars] = await Promise.all([
    Car.find(filter).sort(mongoSort).skip(skip).limit(limitNum).lean(),
    Car.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      totalCars,
      page:       pageNum,
      totalPages: Math.ceil(totalCars / limitNum),
      limit:      limitNum,
    },
  };
};

// Distinct values (case-insensitive, sorted) for building filter dropdowns
const uniqueSorted = (arr) => {
  const seen = new Map();
  for (const v of arr) {
    const s = typeof v === "string" ? v.trim() : "";
    if (s && !seen.has(s.toLowerCase())) seen.set(s.toLowerCase(), s);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
};

const getFilterOptions = async ({ make } = {}) => {
  const base = { status: { $ne: "sold" } };
  const makeName = str(make);

  const [makes, models, locations, colors, fuelTypes, transmissions, bodyTypes, vehicleTypes, years] =
    await Promise.all([
      Car.distinct("make", base),
      makeName ? Car.distinct("model", { ...base, make: exact(makeName) }) : Promise.resolve([]),
      Car.distinct("location", base),
      Car.distinct("color", base),
      Car.distinct("fuelType", base),
      Car.distinct("transmission", base),
      Car.distinct("bodyType", base),
      Car.distinct("vehicleType", base),
      Car.distinct("year", base),
    ]);

  return {
    makes:         uniqueSorted(makes),
    models:        uniqueSorted(models),
    locations:     uniqueSorted(locations),
    colors:        uniqueSorted(colors),
    fuelTypes:     uniqueSorted(fuelTypes),
    transmissions: uniqueSorted(transmissions),
    bodyTypes:     uniqueSorted(bodyTypes),
    vehicleTypes:  vehicleTypes.filter(Boolean),
    years:         years.filter(Boolean).sort((a, b) => b - a),
  };
};

const getCarById = async (id, { countView = false } = {}) => {
  if (countView) {
    // timestamps:false so a page view does not change "updatedAt"
    return await Car.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true, timestamps: false }
    ).lean();
  }
  return await Car.findById(id).lean();
};

const createCar = async (data) => {
  const payload = cleanPayload(data, true);
  payload.stockNo = await nextStockNo();
  payload.soldAt = payload.status === "sold" ? new Date() : null;
  return await Car.create(payload);
};

const updateCar = async (id, data) => {
  const update = cleanPayload(data, false);

  if (update.status === "sold") {
    const existing = await Car.findById(id).select("status soldAt").lean();
    if (!existing) return null;
    if (existing.status !== "sold" || !existing.soldAt) {
      update.soldAt = new Date();
    }
  } else if (update.status === "available") {
    update.soldAt = null;
  }

  // Fields sent empty are removed from the record (soldAt is kept as null)
  const unset = {};
  for (const key of Object.keys(update)) {
    if (update[key] === null && key !== "soldAt") {
      unset[key] = "";
      delete update[key];
    }
  }
  const ops = { $set: update };
  if (Object.keys(unset).length) ops.$unset = unset;

  return await Car.findByIdAndUpdate(id, ops, { new: true, runValidators: true });
};

const deleteCar = async (id) => {
  return await Car.findByIdAndDelete(id);
};

module.exports = {
  getAllCars,
  getFilterOptions,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};