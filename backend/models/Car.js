const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    make:         { type: String, trim: true },
    model:        { type: String, trim: true },
    year:         { type: Number },
    price:        { type: Number },
    mileage:      { type: Number },
    engine:       { type: String, trim: true },
    power:        { type: String, trim: true },
    transmission: { type: String, trim: true },
    fuelType:     { type: String, trim: true },
    drivetrain:   { type: String, trim: true },
    bodyType:     { type: String, trim: true },
    color:        { type: String, trim: true },
    condition:    { type: String, trim: true },
    vin:          { type: String, trim: true },
    description:  { type: String, trim: true },
    location:     { type: String, trim: true },
    isFeatured:   { type: Boolean, default: false },
    isNew:        { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
    soldAt:       { type: Date, default: null },
    images:       { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Car || mongoose.model("Car", carSchema);