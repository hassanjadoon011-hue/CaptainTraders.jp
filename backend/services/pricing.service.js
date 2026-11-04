const ShippingConfig = require("../models/ShippingConfig");

const round2 = (n) => Math.round(n * 100) / 100;
const norm = (s) => String(s || "").trim().toLowerCase();
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const EMPTY_CONFIG = { insuranceRate: 0, inspectionFee: 0, usdToJpy: null, rates: [] };

// The single shipping/pricing record (one document)
const getConfig = async () => (await ShippingConfig.findOne().lean()) || EMPTY_CONFIG;

// Exact port row first, otherwise the country-wide row (empty port)
const findRate = (rates, country, port) => {
  const c = norm(country);
  const p = norm(port);
  const inCountry = (rates || []).filter((r) => norm(r.country) === c);
  return (p && inCountry.find((r) => norm(r.port) === p)) || inCountry.find((r) => !norm(r.port)) || null;
};

/**
 * Total price (CIF) = FOB + freight (+ insurance) (+ inspection)
 * Freight = car M3 x rate per M3 when both are known, otherwise the flat price.
 * Insurance = % of the vehicle (FOB) price.
 * Always worked out on the server, never trusted from the browser.
 */
const calculateQuote = async ({ car, country, port, insurance, inspection, config }) => {
  const cfg = config || (await getConfig());
  const fob = Number(car?.price) || 0;
  const base = {
    available: false,
    currency: "USD",
    fob,
    freight: null,
    freightMethod: null,
    m3: null,
    ratePerM3: null,
    insurance: null,
    inspection: null,
    total: null,
    country: country || "",
    port: port || "",
    reason: "",
  };

  if (!fob) return { ...base, reason: "This vehicle has no price yet. Please send us an inquiry." };
  if (!country) return { ...base, reason: "Please select your country." };

  const rate = findRate(cfg.rates, country, port);
  if (!rate) {
    return { ...base, reason: "No shipping rate for this destination yet. Send an inquiry and we will quote you." };
  }

  const m3 = Number(car.m3) > 0 ? Number(car.m3) : null;
  const perM3 = num(rate.ratePerM3);
  const flat = num(rate.price);

  let freight;
  let freightMethod;
  if (m3 && perM3 > 0) {
    freight = round2(m3 * perM3);
    freightMethod = "m3";
  } else if (flat !== null && flat >= 0) {
    freight = round2(flat);
    freightMethod = "flat";
  } else {
    return {
      ...base,
      reason: "The total cannot be estimated for this vehicle. Send an inquiry for an exact quotation.",
    };
  }

  const insRate = Number(cfg.insuranceRate) || 0;
  const inspFee = Number(cfg.inspectionFee) || 0;
  const insuranceCost = insurance && insRate > 0 ? round2(fob * (insRate / 100)) : 0;
  const inspectionCost = inspection && inspFee > 0 ? round2(inspFee) : 0;

  return {
    ...base,
    available: true,
    freight,
    freightMethod,
    m3: freightMethod === "m3" ? m3 : null,
    ratePerM3: freightMethod === "m3" ? perM3 : null,
    insurance: insuranceCost,
    inspection: inspectionCost,
    total: round2(fob + freight + insuranceCost + inspectionCost),
    country: rate.country,
    port: rate.port || "",
  };
};

module.exports = { calculateQuote, getConfig, findRate, EMPTY_CONFIG };
