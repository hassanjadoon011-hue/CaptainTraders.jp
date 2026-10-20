const router = require("express").Router();
const {
  getMessages,
  getUnreadCount,
  createMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
} = require("../controllers/message.controller");
const { protect } = require("../middleware/auth");
const { messageLimiter } = require("../middleware/rateLimiters");
const mongoose = require("mongoose");

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};

// PUBLIC (contact / inquiry form), limited against spam
router.post("/", messageLimiter, createMessage);

// PROTECTED (admin only)
router.get("/", protect, getMessages);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, validateId, markAsRead);
router.delete("/:id", protect, validateId, deleteMessage);

module.exports = router;