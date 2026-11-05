const mongoose = require("mongoose");

const CATEGORIES = [
  "purchase",     // car bought at auction / from dealer (also stored on Car.purchase)
  "auction_fee",
  "transport",    // inland transport in Japan
  "inspection",
  "repair",
  "storage",
  "documents",    // export certificate, deregistration...
  "shipping",     // ocean freight paid to the shipping line
  "customs",
  "commission",
  "marketing",
  "office",       // rent, salaries, software: business overhead
  "other",
];

// A cost. Linked to a car (vehicle cost) or neither (business overhead).
const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["JPY", "USD"], default: "JPY" },
    // USD value at the time of the expense, so profit reports stay stable when rates move
    amountUSD: { type: Number, min: 0, default: null },

    date:   { type: Date, default: Date.now },
    vendor: { type: String, trim: true },
    reference: { type: String, trim: true }, // invoice / receipt number
    note:   { type: String, trim: true },
    receiptUrl: { type: String, trim: true },

    car:   { type: mongoose.Schema.Types.ObjectId, ref: "Car", default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ car: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ date: -1 });

expenseSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
