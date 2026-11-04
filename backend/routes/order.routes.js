const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controllers/order.controller");
const { protect, authorize } = require("../middleware/auth");
const { messageLimiter } = require("../middleware/rateLimiters");

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};

// PUBLIC (limited against spam)
router.post("/", messageLimiter, ctrl.create);

// ADMIN
router.get("/", protect, authorize("orders.view"), ctrl.list);
router.patch("/:id", protect, authorize("orders.edit"), validateId, ctrl.update);
router.delete("/:id", protect, authorize("orders.delete"), validateId, ctrl.remove);

module.exports = router;