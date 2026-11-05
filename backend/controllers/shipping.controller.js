const mongoose = require("mongoose");
const Car = require("../models/Car");
const ShippingConfig = require("../models/ShippingConfig");
const { calculateQuote, getConfig } = require("../services/pricing.service");
const { estimateImport } = require("../services/import.service");

const text = (v, max = 80) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";
const optNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const fail = (res, message, code = 400) => res.status(code).json({ success: false, message });

/* ───────── PUBLIC ───────── */

// Rates and options for the calculator, country links and exchange rate
const getSettings = async (_req, res, next) => {
  try {
    res.json(await getConfig());
  } catch (err) {
    next(err);
  }
};

const quote = async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(b.carId)) return fail(res, "Invalid car.");

    const car = await Car.findById(b.carId).select("price m3 engine year mfgYear regYear").lean();
    if (!car) return fail(res, "Car not found.", 404);

    const data = await calculateQuote({
      car,
      country: text(b.country, 60),
      port: text(b.port, 60),
      insurance: isTrue(b.insurance),
      inspection: isTrue(b.inspection),
    });
    data.import = await estimateImport({ car, quote: data });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* ───────── ADMIN ───────── */

const saveSettings = async (req, res, next) => {
  try {
    const b = req.body || {};
    const insuranceRate = Number(b.insuranceRate) || 0;
    const inspectionFee = Number(b.inspectionFee) || 0;
    const usdToJpy = optNum(b.usdToJpy);

    if (!(insuranceRate >= 0 && insuranceRate <= 100)) return fail(res, "Insurance rate must be between 0 and 100.");
    if (!(inspectionFee >= 0 && inspectionFee <= 100000)) return fail(res, "Enter a valid inspection fee.");
    if (usdToJpy !== null && !(usdToJpy >= 1 && usdToJpy <= 1000)) return fail(res, "Enter a valid USD/JPY rate.");

    const seen = new Set();
    const rates = [];
    for (const r of Array.isArray(b.rates) ? b.rates : []) {
      const country = text(r.country, 60);
      const port = text(r.port, 60);
      const ratePerM3 = optNum(r.ratePerM3);
      const price = optNum(r.price);
      const label = `${country}${port ? " / " + port : ""}`;

      if (country.length < 2) return fail(res, "Every rate needs a country.");
      if (ratePerM3 === null && price === null) return fail(res, `${label}: enter a rate per M³, a flat price, or both.`);
      if (ratePerM3 !== null && !(ratePerM3 >= 0 && ratePerM3 <= 10000)) return fail(res, `${label}: invalid rate per M³.`);
      if (price !== null && !(price >= 0 && price <= 1000000)) return fail(res, `${label}: invalid flat price.`);

      const key = `${country}|${port}`.toLowerCase();
      if (seen.has(key)) return fail(res, `Duplicate rate: ${label}`);
      seen.add(key);
      rates.push({ country, port, ratePerM3, price });
    }

    const cfg = await ShippingConfig.findOneAndUpdate(
      {},
      { insuranceRate, inspectionFee, usdToJpy, rates },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(cfg);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, quote, saveSettings };
