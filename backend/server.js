const dotenv = require("dotenv");
dotenv.config();

// ─── Refuse to start with unsafe configuration ───────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET is missing or shorter than 32 characters. Refusing to start.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGIN) {
  console.error("❌ ALLOWED_ORIGIN must be set in production. Refusing to start.");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => process.exit(0));
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => process.exit(0));
    });

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled rejection:", err);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();