const mongoose = require("mongoose");

const STATUSES = ["booked", "at_port", "loaded", "departed", "arrived", "cleared", "delivered", "cancelled"];

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bill_of_lading", "export_certificate", "invoice", "inspection", "insurance", "other"],
      default: "other",
    },
    name: { type: String, trim: true },
    url:  { type: String, trim: true, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Ocean shipment of one order's vehicle from Japan to the buyer's port
const shipmentSchema = new mongoose.Schema(
  {
    order:    { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    car:      { type: mongoose.Schema.Types.ObjectId, ref: "Car", default: null },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    status: { type: String, enum: STATUSES, default: "booked" },
    method: { type: String, enum: ["roro", "container"], default: "roro" },

    shippingLine: { type: String, trim: true },
    vessel:       { type: String, trim: true },
    voyage:       { type: String, trim: true },
    bookingNo:    { type: String, trim: true },
    blNo:         { type: String, trim: true }, // bill of lading number
    containerNo:  { type: String, trim: true },

    portOfLoading:   { type: String, trim: true }, // e.g. Nagoya, Yokohama
    portOfDischarge: { type: String, trim: true },
    destinationCountry: { type: String, trim: true },

    etd: { type: Date, default: null }, // estimated departure
    eta: { type: Date, default: null }, // estimated arrival
    departedAt:  { type: Date, default: null },
    arrivedAt:   { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    freightCost: { type: Number, min: 0, default: null }, // what we pay the line (USD)
    documents: { type: [documentSchema], default: [] },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

shipmentSchema.index({ order: 1 }, { unique: true }); // one shipment per order
shipmentSchema.index({ status: 1, eta: 1 });
shipmentSchema.index({ blNo: 1 }, { sparse: true });

shipmentSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);
