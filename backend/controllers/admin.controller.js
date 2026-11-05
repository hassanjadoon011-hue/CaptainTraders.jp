const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { normalizeRole, permissionsFor } = require("../config/permissions");

const isProd = process.env.NODE_ENV === "production";
const TOKEN_HOURS = 8;
const MIN_PASSWORD = 12;

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

// Sign a session and set the cookie
const startSession = (res, admin) => {
  const token = jwt.sign(
    { id: admin._id, role: normalizeRole(admin.role) },
    process.env.JWT_SECRET,
    { expiresIn: `${TOKEN_HOURS}h`, algorithm: "HS256" }
  );
  res.cookie("adminToken", token, { ...cookieOptions, maxAge: TOKEN_HOURS * 60 * 60 * 1000 });
};

// Safe shape sent to the browser (never includes the password)
const publicAdmin = (a) => {
  const role = normalizeRole(a.role);
  return {
    id: a._id,
    name: a.name || "",
    email: a.email,
    role,
    isActive: a.isActive !== false,
    lastLoginAt: a.lastLoginAt || null,
    createdAt: a.createdAt,
    permissions: permissionsFor(role),
  };
};

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

    // Deactivated accounts get the same answer as a wrong password
    if (!admin || !isMatch || admin.isActive === false) {
      return res.status(401).json(INVALID);
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    startSession(res, admin);
    res.json({ success: true, admin: publicAdmin(admin) });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).lean();
    if (!admin) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, data: publicAdmin(admin) });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // Must use the same options as when the cookie was set, or the browser keeps it
  res.clearCookie("adminToken", cookieOptions);
  res.json({ success: true, message: "Logged out" });
};

// Logged-in admin changes their own password. Other sessions are logged out.
const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ success: false, message: "Current and new password are required." });
    }
    if (newPassword.length < MIN_PASSWORD || newPassword.length > 128) {
      return res
        .status(400)
        .json({ success: false, message: `New password must be ${MIN_PASSWORD}–128 characters.` });
    }

    const admin = await Admin.findById(req.admin.id).select("+password");
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    admin.password = await bcrypt.hash(newPassword, 12);
    admin.passwordChangedAt = new Date(Date.now() - 1000); // the new session below stays valid
    await admin.save();

    startSession(res, admin);
    res.json({ success: true, message: "Password changed." });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, logout, changeMyPassword, publicAdmin, MIN_PASSWORD };
