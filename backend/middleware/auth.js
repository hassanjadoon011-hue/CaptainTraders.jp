const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const getAllowedOrigins = () =>
  process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173"];

const protect = async (req, res, next) => {
  // CSRF defence: add/edit/delete must come from your own website
  if (!SAFE_METHODS.includes(req.method)) {
    const origin = req.get("origin");
    if (origin && !getAllowedOrigins().includes(origin)) {
      return res.status(403).json({ success: false, message: "Request blocked" });
    }
  }

  const token = req.cookies?.adminToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  try {
    // Reject tokens of admins that have been deleted
    const admin = await Admin.findById(decoded.id).select("_id role");
    if (!admin) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    req.admin = { id: admin._id.toString(), role: admin.role };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };