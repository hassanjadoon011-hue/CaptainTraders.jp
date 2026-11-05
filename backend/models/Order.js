const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: Number, required: true, unique: true },
    type:    { type: String, enum: ["inquiry", "order"], default: "inquiry" },
    status: {
      type: String,
      enum: ["new", "invoiced", "paid", "shipped", "completed", "cancelled"],
      default: "new",
    },
    isRead: { type: Boolean, default: false },

    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    // CRM record for this buyer (the "customer" copy below keeps what they typed)
    customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    // Final agreed sale, set when the invoice is issued
    invoice: {
      number:   { type: String, trim: true },
      amount:   { type: Number, min: 0 },
      currency: { type: String, enum: ["USD", "JPY"], default: "USD" },
      terms:    { type: String, enum: ["FOB", "CFR", "CIF"], default: "CIF" },
      issuedAt: { type: Date },
      dueAt:    { type: Date },
    },
    // Copy of the car at the time of the request, so it stays readable if the car is deleted
    carInfo: {
      stockNo:  Number,
      title:    String,
      year:     Number,
      image:    String,
      fobPrice: Number,
    },

    customer: {
      name:          { type: String, trim: true },
      email:         { type: String, trim: true },
      country:       { type: String, trim: true },
      deliveryPlace: { type: String, trim: true },
      address:       { type: String, trim: true },
      city:          { type: String, trim: true },
      tel:           { type: String, trim: true },
    },

    destination: {
      country:    String,
      port:       String,
      insurance:  Boolean,
      inspection: Boolean,
    },

    quote: {
      available:  Boolean,
      fob:        Number,
      freight:    Number,
      freightMethod: String, // "m3" or "flat": how freight was worked out
      m3:         Number,
      ratePerM3:  Number,
      insurance:  Number,
      inspection: Number,
      total:      Number,
    },

    message:   { type: String, trim: true },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ car: 1 });
orderSchema.index({ customerRef: 1, createdAt: -1 });
orderSchema.index({ "invoice.number": 1 }, { unique: true, partialFilterExpression: { "invoice.number": { $type: "string" } } });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);