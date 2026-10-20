const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const isProd = process.env.NODE_ENV === "production";
const TOKEN_HOURS = 8;

// Behind the Vercel proxy the cookie is first-party, so "strict" works.
// Only set COOKIE_SAMESITE=none if the frontend calls Render directly (not recommended).
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: process.env.COOKIE_SAMESITE || (isProd ? "strict" : "lax"),
  path: "/",
};

// Used so a wrong email takes as long as a wrong password (blocks email guessing by timing)
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const INVALID = { success: false, message: "Invalid email or password" };

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || cleanEmail.length > 200 || password.length > 128) {
      return res.status(401).json(INVALID);
    }

    const admin = await Admin.findOne({ email: cleanEmail }).select("+password");

    // Always run bcrypt, even if the admin doesn't exist
    const isMatch = await bcrypt.compare(password, admin ? admin.password : DUMMY_HASH);

    if (!admin || !isMatch) {
      return res.status(401).json(INVALID);
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: `${TOKEN_HOURS}h`, algorithm: "HS256" }
    );

    res.cookie("adminToken", token, {
      ...cookieOptions,
      maxAge: TOKEN_HOURS * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      admin: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // Must use the same options as when the cookie was set, or the browser keeps it
  res.clearCookie("adminToken", cookieOptions);
  res.json({ success: true, message: "Logged out" });
};

module.exports = { login, getMe, logout };