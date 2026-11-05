const mongoose = require("mongoose");

// One row per destination. Freight = car M3 x ratePerM3; "price" is the flat
// fallback for cars without a volume. At least one of the two is required.
const rateSchema = new mongoose.Schema(
  {
    country:   { type: String, required: true, trim: true },
    port:      { type: String, default: "", trim: true }, // empty = whole country
    ratePerM3: { type: Number, default: null, min: 0 },
    price:     { type: Number, default: null, min: 0 },   // flat freight (USD)
  },
  { _id: false }
);

const shippingConfigSchema = new mongoose.Schema(
  {
    insuranceRate: { type: Number, default: 0, min: 0, max: 100 }, // % of vehicle price
    inspectionFee: { type: Number, default: 0, min: 0 },
    usdToJpy:      { type: Number, default: null, min: 0 },
    rates:         { type: [rateSchema], default: [] },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ShippingConfig || mongoose.model("ShippingConfig", shippingConfigSchema);
