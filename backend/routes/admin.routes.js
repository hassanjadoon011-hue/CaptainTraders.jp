const router = require("express").Router();
const { login, getMe, logout } = require("../controllers/admin.controller");
const { protect } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);
router.post("/logout", logout);

module.exports = router;