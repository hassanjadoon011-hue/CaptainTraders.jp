const mongoose = require("mongoose");

// One charge in a country's import costs, applied in order.
// percent: rate % of base. base "cif" | "fob" | "cumulative" (CIF + earlier % taxes)
// fixed:   amount in USD (port handling, clearing agent, registration...)
const componentSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    kind:   { type: String, enum: ["percent", "fixed"], required: true },
    rate:   { type: Number, min: 0, max: 1000, default: null },   // percent
    amount: { type: Number, min: 0, max: 1e7, default: null },    // USD
    base:   { type: String, enum: ["cif", "fob", "cumulative"], default: "cif" },
    // Optional conditions (empty = always applies)
    minAge: { type: Number, min: 0, max: 100, default: null },    // vehicle age in years
    maxAge: { type: Number, min: 0, max: 100, default: null },
    minCc:  { type: Number, min: 0, max: 20000, default: null },  // engine size
    maxCc:  { type: Number, min: 0, max: 20000, default: null },
  },
  { _id: false }
);

const importRuleSchema = new mongoose.Schema(
  {
    country:    { type: String, required: true, trim: true },
    countryKey: { type: String, required: true, unique: true },   // lowercase, for matching
    active:     { type: Boolean, default: true },
    maxAgeYears: { type: Number, min: 0, max: 100, default: null }, // import age limit
    currency: {
      code:   { type: String, trim: true, uppercase: true, default: "" }, // e.g. KES
      perUSD: { type: Number, min: 0, default: null },                    // 1 USD = x local
    },
    components: { type: [componentSchema], default: [] },
    notes:      { type: String, trim: true, default: "" },             // shown to buyers
  },
  { timestamps: true }
);

// Mongoose 9: sync hook, no next()
importRuleSchema.pre("validate", function () {
  if (this.country) this.countryKey = this.country.trim().toLowerCase();
});

module.exports = mongoose.models.ImportRule || mongoose.model("ImportRule", importRuleSchema);
