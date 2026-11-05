const ImportRule = require("../models/ImportRule");

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// "1800", "1,800cc", "1.8L" -> 1800
const engineCc = (engine) => {
  const s = String(engine || "").replace(/,/g, "").trim();
  if (!s) return null;
  const litres = s.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (litres) return Math.round(Number(litres[1]) * 1000);
  const n = Number((s.match(/\d+(?:\.\d+)?/) || [])[0]);
  if (!n) return null;
  return n < 20 ? Math.round(n * 1000) : Math.round(n); // "1.8" means litres
};

// Age in years from manufacture (or registration / model) year
const vehicleAge = (car, now = new Date()) => {
  const y = car?.mfgYear || car?.regYear || car?.year;
  return y ? Math.max(0, now.getFullYear() - Number(y)) : null;
};

const inRange = (v, min, max) =>
  (min == null || (v != null && v >= min)) && (max == null || (v != null && v <= max));

const findRule = (country) =>
  country ? ImportRule.findOne({ countryKey: String(country).trim().toLowerCase(), active: true }).lean() : null;

/**
 * Import cost estimate on top of a shipping quote (from pricing.service.calculateQuote).
 * Customs value = CIF = FOB + freight + insurance. Inspection is a service fee, not taxed.
 */
const estimateImport = async ({ car, quote, rule }) => {
  const r = rule === undefined ? await findRule(quote?.country) : rule;
  if (!r) return null;

  const base = { country: r.country, notes: r.notes || "", currency: r.currency?.code || "", perUSD: r.currency?.perUSD || null };
  if (!quote?.available) return { ...base, available: false, reason: "Choose a destination with a shipping rate first." };

  const age = vehicleAge(car);
  const cc = engineCc(car?.engine);
  if (r.maxAgeYears != null && age != null && age > r.maxAgeYears) {
    return { ...base, available: false, allowed: false, age, reason: `${r.country} does not allow vehicles older than ${r.maxAgeYears} years (this one is ${age}).` };
  }

  const fob = round2(quote.fob);
  const cif = round2(quote.fob + quote.freight + (quote.insurance || 0));
  let cumulative = cif;
  const lines = [];
  const skipped = [];

  for (const c of r.components || []) {
    const needsAge = c.minAge != null || c.maxAge != null;
    const needsCc = c.minCc != null || c.maxCc != null;
    if ((needsAge && age == null) || (needsCc && cc == null)) { skipped.push(c.name); continue; }
    if (!inRange(age, c.minAge, c.maxAge) || !inRange(cc, c.minCc, c.maxCc)) continue;

    let amount;
    let detail;
    if (c.kind === "percent") {
      const baseValue = c.base === "fob" ? fob : c.base === "cumulative" ? cumulative : cif;
      amount = round2((baseValue * (c.rate || 0)) / 100);
      detail = `${c.rate}% of ${c.base === "cumulative" ? "CIF + taxes" : c.base.toUpperCase()}`;
      cumulative = round2(cumulative + amount);
    } else {
      amount = round2(c.amount || 0);
      detail = "Fixed charge";
    }
    lines.push({ name: c.name, amount, detail });
  }

  const totalImport = round2(lines.reduce((s, l) => s + l.amount, 0));
  const landed = round2(quote.total + totalImport);
  return {
    ...base,
    available: true,
    allowed: true,
    age,
    engineCc: cc,
    customsValue: cif,
    lines,
    skipped, // charges that need an age / engine size the car does not have
    totalImport,
    landed,
    landedLocal: base.perUSD ? Math.round(landed * base.perUSD) : null,
  };
};

module.exports = { estimateImport, findRule, engineCc, vehicleAge };
