const ImportRule = require("../models/ImportRule");
const { text, longText, num, oneOf, fail } = require("../utils/validate");

const optNum = (v, max) => (v === "" || v === null || v === undefined ? null : num(v, { min: 0, max }));

// Validate one charge; returns { data } or { error }
const readComponent = (c, i) => {
  const label = `Charge ${i + 1}`;
  const name = text(c?.name, 80);
  if (!name) return { error: `${label}: enter a name.` };
  const kind = oneOf(c.kind, ["percent", "fixed"]);
  if (!kind) return { error: `${name}: choose percent or fixed.` };
  const out = { name, kind, base: oneOf(c.base, ["cif", "fob", "cumulative"]) || "cif" };
  if (kind === "percent") {
    out.rate = num(c.rate, { min: 0, max: 1000 });
    if (out.rate == null) return { error: `${name}: enter a valid percentage.` };
  } else {
    out.amount = num(c.amount, { min: 0, max: 1e7 });
    if (out.amount == null) return { error: `${name}: enter a valid amount.` };
  }
  for (const [k, max] of [["minAge", 100], ["maxAge", 100], ["minCc", 20000], ["maxCc", 20000]]) {
    const v = optNum(c[k], max);
    if (v === undefined) return { error: `${name}: invalid ${k}.` };
    out[k] = v;
  }
  if (out.minAge != null && out.maxAge != null && out.minAge > out.maxAge) return { error: `${name}: min age is above max age.` };
  if (out.minCc != null && out.maxCc != null && out.minCc > out.maxCc) return { error: `${name}: min engine size is above max.` };
  return { data: out };
};

const readRule = (b = {}) => {
  const country = text(b.country, 60);
  if (!country || country.length < 2) return { error: "Choose a country." };
  const maxAgeYears = optNum(b.maxAgeYears, 100);
  if (maxAgeYears === undefined) return { error: "Invalid age limit." };
  const code = text(b.currency?.code, 10) || "";
  if (code && !/^[A-Za-z]{3}$/.test(code)) return { error: "Currency code must be 3 letters, e.g. KES." };
  const perUSD = optNum(b.currency?.perUSD, 1e7);
  if (perUSD === undefined) return { error: "Invalid local exchange rate." };
  if (!Array.isArray(b.components)) return { error: "Charges are missing." };
  if (b.components.length > 30) return { error: "Too many charges (max 30)." };
  const components = [];
  for (let i = 0; i < b.components.length; i++) {
    const r = readComponent(b.components[i], i);
    if (r.error) return r;
    components.push(r.data);
  }
  return {
    data: {
      country,
      active: b.active !== false,
      maxAgeYears,
      currency: { code: code.toUpperCase(), perUSD },
      components,
      notes: longText(b.notes, 1000) || "",
    },
  };
};

/* PUBLIC: countries that have an import estimate (for the calculator) */
const publicList = async (_req, res, next) => {
  try {
    const rules = await ImportRule.find({ active: true }).select("country").sort({ country: 1 }).lean();
    res.json({ success: true, data: rules.map((r) => r.country) });
  } catch (err) {
    next(err);
  }
};

/* ADMIN */
const list = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await ImportRule.find().sort({ country: 1 }).lean() });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { data, error } = readRule(req.body);
    if (error) return fail(res, error);
    if (await ImportRule.exists({ countryKey: data.country.toLowerCase() })) return fail(res, `${data.country} already has import rules.`, 409);
    res.status(201).json({ success: true, data: await ImportRule.create(data) });
  } catch (err) {
    if (err?.code === 11000) return fail(res, "This country already has import rules.", 409);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { data, error } = readRule(req.body);
    if (error) return fail(res, error);
    const rule = await ImportRule.findById(req.params.id);
    if (!rule) return fail(res, "Import rules not found.", 404);
    if (data.country.toLowerCase() !== rule.countryKey && (await ImportRule.exists({ countryKey: data.country.toLowerCase() }))) {
      return fail(res, `${data.country} already has import rules.`, 409);
    }
    Object.assign(rule, data);
    await rule.save();
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const rule = await ImportRule.findByIdAndDelete(req.params.id);
    if (!rule) return fail(res, "Import rules not found.", 404);
    res.json({ success: true, message: "Import rules deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { publicList, list, create, update, remove };
