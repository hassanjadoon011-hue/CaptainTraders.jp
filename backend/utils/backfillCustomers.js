// One-time (safe to re-run): build CRM customers from existing orders and messages.
// Usage: node utils/backfillCustomers.js [--dry-run]
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Order = require("../models/Order");
const Message = require("../models/Message");
const { upsertFromContact, markActive } = require("../services/customer.service");

const DRY = process.argv.includes("--dry-run");
const PAID = ["paid", "shipped", "completed"];

const run = async () => {
  await connectDB();
  const stats = { orders: 0, messages: 0, skippedNoEmail: 0 };

  // Oldest first, so the first contact sets the customer's source
  const orders = await Order.find({ customerRef: null }).sort({ createdAt: 1 }).lean();
  for (const o of orders) {
    if (!o.customer?.email) { stats.skippedNoEmail++; continue; }
    stats.orders++;
    if (DRY) continue;
    const c = await upsertFromContact(o.customer, o.type === "order" ? "order" : "inquiry", o.createdAt);
    if (!c) continue;
    await Order.updateOne({ _id: o._id }, { $set: { customerRef: c._id } });
    if (PAID.includes(o.status)) await markActive(c._id);
  }

  const messages = await Message.find({ customerRef: null }).sort({ createdAt: 1 }).lean();
  for (const m of messages) {
    if (!m.email) { stats.skippedNoEmail++; continue; }
    stats.messages++;
    if (DRY) continue;
    const c = await upsertFromContact(m, "message", m.createdAt);
    if (c) await Message.updateOne({ _id: m._id }, { $set: { customerRef: c._id } });
  }

  console.log(`${DRY ? "[dry run] would link" : "Linked"} ${stats.orders} orders and ${stats.messages} messages.` +
    ` Skipped ${stats.skippedNoEmail} without an email.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
