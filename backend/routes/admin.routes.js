const router = require("express").Router();
const mongoose = require("mongoose");
const { login, getMe, logout, changeMyPassword } = require("../controllers/admin.controller");
const users = require("../controllers/adminUser.controller");
const { protect, authorize } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);
router.post("/logout", logout);
router.put("/me/password", protect, loginLimiter, changeMyPassword);

// Admin user management (owners only)
router.get("/users", protect, authorize("users.manage"), users.list);
router.post("/users", protect, authorize("users.manage"), users.create);
router.patch("/users/:id", protect, authorize("users.manage"), validateId, users.update);
router.delete("/users/:id", protect, authorize("users.manage"), validateId, users.remove);

module.exports = router;
