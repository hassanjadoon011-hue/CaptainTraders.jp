const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    name:    { type: String, trim: true },
    email:   { type: String, trim: true },
    subject: { type: String, trim: true },
    country: { type: String, trim: true },
    message: { type: String, trim: true },
    isRead:  { type: Boolean, default: false },
    customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);