require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const run = async () => {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.log('Usage: node utils/createAdmin.js "email@example.com" "a-long-strong-password"');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error("❌ That does not look like a valid email.");
    process.exit(1);
  }

  if (passwordArg.length < 14) {
    console.error("❌ Password must be at least 14 characters.");
    process.exit(1);
  }

  await connectDB();

  const hash = await bcrypt.hash(passwordArg, 12);

  await Admin.findOneAndUpdate(
    { email },
    { email, password: hash, role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅ Admin ready: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});