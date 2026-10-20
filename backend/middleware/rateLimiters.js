const rateLimit = require("express-rate-limit");

const build = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
    ...extra,
  });

// Whole API: 300 requests per 15 minutes per IP
const apiLimiter = build(
  15 * 60 * 1000,
  300,
  "Too many requests. Please try again later."
);

// Admin login: 5 failed attempts per 15 minutes per IP
const loginLimiter = build(
  15 * 60 * 1000,
  5,
  "Too many login attempts. Please try again in 15 minutes.",
  { skipSuccessfulRequests: true }
);

// Public contact form: 5 messages per hour per IP
const messageLimiter = build(
  60 * 60 * 1000,
  5,
  "Too many messages sent. Please try again later."
);

module.exports = { apiLimiter, loginLimiter, messageLimiter };