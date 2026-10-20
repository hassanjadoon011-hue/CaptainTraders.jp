const Car = require("../models/Car");

// Maps frontend sort values to MongoDB sort strings
const SORT_MAP = {
  newest:     "-createdAt",
  oldest:     "createdAt",
  price_asc:  "price",
  price_desc: "-price",
};

// Escapes special regex characters so user input can't break the query
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllCars = async ({
  page = 1,
  limit = 10,
  sort = "newest",
  make,
  fuelType,
  bodyType,
  yearFrom,
  yearTo,
  minPrice,
  maxPrice,
  status,
  search,
} = {}) => {
  // ─── Build filter ───────────────────────────────────────────────
  const filter = {};

  if (make)     filter.make     = { $regex: new RegExp(`^${escapeRegex(make)}$`, "i") };
  if (fuelType) filter.fuelType = { $regex: new RegExp(`^${escapeRegex(fuelType)}$`, "i") };
  if (bodyType) filter.bodyType = { $regex: new RegExp(`^${escapeRegex(bodyType)}$`, "i") };

  if (yearFrom || yearTo) {
    filter.year = {
      ...(yearFrom && { $gte: Number(yearFrom) }),
      ...(yearTo && { $lte: Number(yearTo) }),
    };
  }

  if (minPrice || maxPrice) {
    filter.price = {
      ...(minPrice && { $gte: Number(minPrice) }),
      ...(maxPrice && { $lte: Number(maxPrice) }),
    };
  }

  // status=available -> everything not sold (also includes old cars with no status field)
  // status=sold      -> only sold cars
  // no status        -> all cars
  if (status === "available") filter.status = { $ne: "sold" };
  if (status === "sold")      filter.status = "sold";

  // Text search across make and model (used by the admin search bar)
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [{ make: rx }, { model: rx }];
  }

  // ─── Pagination & sort ──────────────────────────────────────────
  const pageNum   = Math.max(1, Number(page) || 1);
  const limitNum  = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip      = (pageNum - 1) * limitNum;
  const mongoSort = SORT_MAP[sort] || "-createdAt";

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

const getCarById = async (id) => {
  return await Car.findById(id).lean();
};

const createCar = async (data) => {
  const payload = { ...data };
  payload.soldAt = payload.status === "sold" ? new Date() : null;
  return await Car.create(payload);
};

const updateCar = async (id, data) => {
  const update = { ...data };

  if (data.status === "sold") {
    // Only stamp the sold date the first time the car becomes sold
    const existing = await Car.findById(id).select("status soldAt").lean();
    if (!existing) return null;
    if (existing.status !== "sold" || !existing.soldAt) {
      update.soldAt = new Date();
    } else {
      delete update.soldAt;
    }
  } else if (data.status === "available") {
    update.soldAt = null;
  } else {
    // Nobody can set the sold date by hand
    delete update.soldAt;
  }

  return await Car.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

const deleteCar = async (id) => {
  return await Car.findByIdAndDelete(id);
};

module.exports = { getAllCars, getCarById, createCar, updateCar, deleteCar };