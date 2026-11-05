const router = require("express").Router();
const ctrl = require("../controllers/shipping.controller");
const { protect, authorize } = require("../middleware/auth");

router.get("/", ctrl.getSettings);
router.post("/quote", ctrl.quote);
router.put("/", protect, authorize("shipping.edit"), ctrl.saveSettings);

module.exports = router;
