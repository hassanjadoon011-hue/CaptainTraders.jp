const router = require("express").Router();
const { summary } = require("../controllers/dashboard.controller");
const { protect, authorize } = require("../middleware/auth");

router.get("/summary", protect, authorize("dashboard.view"), summary);

module.exports = router;