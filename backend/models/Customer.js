const mongoose = require("mongoose");

// CRM record: one per buyer, matched by email. Orders and messages link here.
const customerSchema = new mongoose.Schema(
  {
    name:    { type: String, trim: true, required: true },
    email:   { type: String, trim: true, lowercase: true }, // main match key
    phone:   { type: String, trim: true },
    whatsapp:{ type: String, trim: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    city:    { type: String, trim: true },
    address: { type: String, trim: true },
    deliveryPort: { type: String, trim: true }, // usual port of discharge

    status: {
      type: String,
      enum: ["lead", "active", "inactive", "blocked"],
      default: "lead", // becomes "active" after a paid order
    },
    source: {
      type: String,
      enum: ["inquiry", "order", "message", "manual", "import"],
      default: "manual",
    },
    tags:  { type: [String], default: [] },
    notes: { type: String, trim: true },

    assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    lastContactAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique when present; customers without an email are allowed
customerSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);
customerSchema.index({ country: 1 });
customerSchema.index({ status: 1, updatedAt: -1 });
customerSchema.index({ name: "text", email: "text", company: "text", phone: "text" });

module.exports = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
