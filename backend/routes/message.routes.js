const router = require("express").Router();
const {
  getMessages,
  getUnreadCount,
  createMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
} = require("../controllers/message.controller");
const { protect, authorize } = require("../middleware/auth");
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
router.get("/", protect, authorize("messages.view"), getMessages);
router.get("/unread-count", protect, authorize("messages.view"), getUnreadCount);
router.patch("/read-all", protect, authorize("messages.edit"), markAllAsRead);
router.patch("/:id/read", protect, authorize("messages.edit"), validateId, markAsRead);
router.delete("/:id", protect, authorize("messages.delete"), validateId, deleteMessage);

module.exports = router;