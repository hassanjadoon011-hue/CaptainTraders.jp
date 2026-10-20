
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const mongoUri = process.env.MONGODB_URI;

  if (!email || !password || !mongoUri) {
    throw new Error(
      "ADMIN_EMAIL, ADMIN_PASSWORD, and MONGODB_URI must be set."
    );
  }

  await mongoose.connect(mongoUri);

  try {
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}. No changes made.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`Admin created successfully: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((err) => {
  console.error("Admin seed failed:", err.message);
  process.exitCode = 1;
});
