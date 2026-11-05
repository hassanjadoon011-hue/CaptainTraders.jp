const router = require("express").Router();
const ctrl = require("../controllers/importRule.controller");
const { protect, authorize } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.get("/countries", ctrl.publicList); // public
router.get("/", protect, authorize("shipping.view"), ctrl.list);
router.post("/", protect, authorize("shipping.edit"), ctrl.create);
router.put("/:id", protect, authorize("shipping.edit"), validateId(), ctrl.update);
router.delete("/:id", protect, authorize("shipping.edit"), validateId(), ctrl.remove);

module.exports = router;
