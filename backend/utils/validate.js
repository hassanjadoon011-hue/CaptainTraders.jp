// Small input helpers shared by the admin controllers.
// Each returns a clean value or undefined (= "not provided / invalid").
const mongoose = require("mongoose");

const text = (v, max = 200) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : undefined;
const longText = (v, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

// "" / null clears a number (returns null); bad input returns undefined
const num = (v, { min = 0, max = 1e9 } = {}) => {
  if (v === "" || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

const date = (v) => {
  if (v === "" || v === null) return null;
  const d = new Date(v);
  return typeof v === "string" || typeof v === "number" ? (isNaN(d) ? undefined : d) : undefined;
};

const oneOf = (v, list) => (typeof v === "string" && list.includes(v) ? v : undefined);
const id = (v) => (typeof v === "string" && mongoose.Types.ObjectId.isValid(v) ? v : undefined);
const url = (v) => (typeof v === "string" && /^https:\/\/\S+$/i.test(v.trim()) ? v.trim().slice(0, 500) : undefined);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fail = (res, message, code = 400) => res.status(code).json({ success: false, message });
const page = (q, max = 50) => {
  const p = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(max, Math.max(1, Number(q.limit) || 20));
  return { page: p, limit, skip: (p - 1) * limit };
};

/**
 * Copy allowed fields from body using a spec: { field: (value) => clean | undefined }.
 * Unknown fields are ignored. Returns { data } or { error: "field" }.
 */
const pick = (body, spec, { partial = true } = {}) => {
  const data = {};
  for (const [key, parse] of Object.entries(spec)) {
    if (!(key in (body || {}))) continue;
    const v = parse(body[key]);
    if (v === undefined) return { error: key };
    data[key] = v;
  }
  return partial || Object.keys(data).length ? { data } : { error: "body" };
};

module.exports = { text, longText, num, date, oneOf, id, url, escapeRegex, fail, page, pick };
