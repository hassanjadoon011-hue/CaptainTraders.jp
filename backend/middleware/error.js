const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // Invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: "Duplicate field value" });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid request body" });
  }

  // Request body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request too large" });
  }

  // Blocked by the CORS allowlist
  if (typeof err.message === "string" && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }

  // Bad or expired token
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
};

module.exports = errorHandler;