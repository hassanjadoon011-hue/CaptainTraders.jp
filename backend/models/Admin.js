const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true, select: false },
    // "admin" = accounts created before roles existed (treated as owner)
    role: {
      type: String,
      enum: ["owner", "manager", "sales", "viewer", "admin"],
      default: "viewer",
    },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date, default: null }, // sessions issued before this are rejected
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
