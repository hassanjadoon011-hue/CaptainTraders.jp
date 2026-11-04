const mongoose = require("mongoose");

// Money received from a customer against an order (an order can have several payments)
const paymentSchema = new mongoose.Schema(
  {
    order:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    amount:   { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["USD", "JPY"], default: "USD" },
    amountUSD: { type: Number, min: 0, default: null }, // value in USD on the day received

    method: {
      type: String,
      enum: ["tt", "bank_transfer", "cash", "card", "paypal", "other"],
      default: "tt", // telegraphic transfer
    },
    status: { type: String, enum: ["received", "pending", "refunded"], default: "received" },
    receivedAt: { type: Date, default: Date.now },
    reference:  { type: String, trim: true }, // bank / SWIFT reference
    note:       { type: String, trim: true },
    proofUrl:   { type: String, trim: true }, // transfer slip

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, receivedAt: -1 });
paymentSchema.index({ customer: 1, receivedAt: -1 });
paymentSchema.index({ receivedAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
