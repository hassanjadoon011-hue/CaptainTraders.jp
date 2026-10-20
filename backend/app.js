const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const { apiLimiter } = require("./middleware/rateLimiters");

const carRoutes = require("./routes/car.routes");
const adminRoutes = require("./routes/admin.routes");
const messageRoutes = require("./routes/message.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

// Number of proxies in front of the server (needed so rate limiting sees the real visitor IP)
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
app.disable("x-powered-by");

// ─── Security & Performance ───────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Body Parsing (JSON only) ─────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ─── NoSQL Injection Sanitization ────────────────────────────────────────────
app.use((req, _res, next) => {
  const q = { ...req.query };
  Object.defineProperty(req, "query", {
    writable: true,
    configurable: true,
    value: q,
  });
  next();
});
app.use(
  mongoSanitize({
    allowDots: true,
    replaceWith: "_",
    onSanitizeError: (req, res) => {
      res.status(400).json({ success: false, message: "Invalid input detected" });
    },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/cars", carRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;