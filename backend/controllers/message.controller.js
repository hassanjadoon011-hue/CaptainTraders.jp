const Message = require("../models/Message");

// Old messages have no isRead field, so "unread" means isRead is not true
const UNREAD_FILTER = { isRead: { $ne: true } };

const getMessages = async (req, res, next) => {
  try {
    const pageNum  = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip     = (pageNum - 1) * limitNum;

    const [messages, total, unreadCount] = await Promise.all([
      Message.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Message.countDocuments(),
      Message.countDocuments(UNREAD_FILTER),
    ]);

    res.json({
      success: true,
      data: messages,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments(UNREAD_FILTER);
    res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    next(err);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { name, email, message, subject, country } = req.body;

    if (!name || !String(name).trim() || !message || !String(message).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name and message are required" });
    }

    const created = await Message.create({ name, email, message, subject, country });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Message.updateMany(UNREAD_FILTER, { isRead: true });
    res.json({ success: true, message: "All messages marked as read" });
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMessages,
  getUnreadCount,
  createMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
};