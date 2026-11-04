const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    stockNo:       { type: Number },

    make:          { type: String, trim: true },
    model:         { type: String, trim: true },
    year:          { type: Number },

    // price = current FOB price. originalPrice = price before discount (optional)
    price:         { type: Number },
    originalPrice: { type: Number },

    mileage:       { type: Number },
    engine:        { type: String, trim: true },
    engineCode:    { type: String, trim: true },
    power:         { type: String, trim: true },
    transmission:  { type: String, trim: true },
    fuelType:      { type: String, trim: true },
    drivetrain:    { type: String, trim: true },
    bodyType:      { type: String, trim: true },
    vehicleType: {
      type: String,
      enum: ["domestic", "hiace-van", "pickup", "truck", "bus", "commercial", "heavy-machinery"],
    },
    steering: { type: String, enum: ["Right", "Left"] },
    color:         { type: String, trim: true },
    condition:     { type: String, trim: true },

    vin:           { type: String, trim: true }, // shown as "Chassis No."
    modelCode:     { type: String, trim: true },

    regYear:       { type: Number },
    regMonth:      { type: Number, min: 1, max: 12 },
    mfgYear:       { type: Number },
    mfgMonth:      { type: Number, min: 1, max: 12 },

    seats:         { type: Number },
    doors:         { type: Number },
    m3:            { type: Number }, // cubic metres, used for shipping cost

    features:      { type: [String], default: [] },
    description:   { type: String, trim: true },
    location:      { type: String, trim: true }, // yard / port

    isFeatured:    { type: Boolean, default: false },
    isNew:         { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    isBestDeal:    { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
    soldAt:        { type: Date, default: null },
    views:         { type: Number, default: 0 },
    images:        { type: [String], default: [] },
  },
  { timestamps: true }
);

carSchema.index({ status: 1, createdAt: -1 });
carSchema.index({ make: 1, model: 1 });
carSchema.index({ price: 1 });
carSchema.index({ stockNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Car || mongoose.model("Car", carSchema);