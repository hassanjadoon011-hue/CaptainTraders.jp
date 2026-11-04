const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const { ROLE_KEYS, normalizeRole, roleList } = require("../config/permissions");
const { publicAdmin, MIN_PASSWORD } = require("./admin.controller");

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v, max = 80) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
const fail = (res, message, code = 400) => res.status(code).json({ success: false, message });

const validPassword = (p) => typeof p === "string" && p.length >= MIN_PASSWORD && p.length <= 128;
const PASSWORD_MSG = `Password must be ${MIN_PASSWORD}–128 characters.`;

// Owners that can still log in ("admin" = legacy owner)
const activeOwnerCount = () =>
  Admin.countDocuments({ role: { $in: ["owner", "admin"] }, isActive: { $ne: false } });

const list = async (_req, res, next) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: admins.map(publicAdmin), roles: roleList() });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const b = req.body || {};
    const email = text(b.email, 200).toLowerCase();
    const name = text(b.name, 80);
    const role = b.role;

    if (!EMAIL_RX.test(email)) return fail(res, "Enter a valid email address.");
    if (!ROLE_KEYS.includes(role)) return fail(res, "Choose a valid role.");
    if (!validPassword(b.password)) return fail(res, PASSWORD_MSG);
    if (await Admin.exists({ email })) return fail(res, "An admin with this email already exists.", 409);

    const admin = await Admin.create({
      email,
      name,
      role,
      password: await bcrypt.hash(b.password, 12),
    });
    res.status(201).json({ success: true, data: publicAdmin(admin.toObject()) });
  } catch (err) {
    if (err?.code === 11000) return fail(res, "An admin with this email already exists.", 409);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const b = req.body || {};
    const admin = await Admin.findById(req.params.id);
    if (!admin) return fail(res, "Admin not found.", 404);

    const isSelf = admin._id.toString() === req.admin.id;
    const wasOwner = normalizeRole(admin.role) === "owner" && admin.isActive !== false;

    if ("name" in b) admin.name = text(b.name, 80);

    if ("role" in b) {
      if (!ROLE_KEYS.includes(b.role)) return fail(res, "Choose a valid role.");
      if (isSelf && b.role !== normalizeRole(admin.role)) return fail(res, "You cannot change your own role.");
      admin.role = b.role;
    }

    if ("isActive" in b) {
      const active = b.isActive === true;
      if (isSelf && !active) return fail(res, "You cannot deactivate your own account.");
      admin.isActive = active;
    }

    if ("password" in b) {
      if (!validPassword(b.password)) return fail(res, PASSWORD_MSG);
      admin.password = await bcrypt.hash(b.password, 12);
      admin.passwordChangedAt = new Date(); // logs that admin out everywhere
    }

    const stillOwner = normalizeRole(admin.role) === "owner" && admin.isActive !== false;
    if (wasOwner && !stillOwner && (await activeOwnerCount()) <= 1) {
      return fail(res, "There must always be at least one active owner.");
    }

    await admin.save();
    res.json({ success: true, data: publicAdmin(admin.toObject()) });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    if (req.params.id === req.admin.id) return fail(res, "You cannot delete your own account.");

    const admin = await Admin.findById(req.params.id).lean();
    if (!admin) return fail(res, "Admin not found.", 404);

    const isActiveOwner = normalizeRole(admin.role) === "owner" && admin.isActive !== false;
    if (isActiveOwner && (await activeOwnerCount()) <= 1) {
      return fail(res, "There must always be at least one active owner.");
    }

    await Admin.deleteOne({ _id: admin._id });
    res.json({ success: true, message: "Admin deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
