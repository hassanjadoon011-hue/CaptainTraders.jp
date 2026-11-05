const mongoose = require("mongoose");

// Keeps a running number so every car gets a unique stock number
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.models.Counter || mongoose.model("Counter", counterSchema);