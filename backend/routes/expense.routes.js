const router = require("express").Router();
const ctrl = require("../controllers/expense.controller");
const { protect, authorize } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.get("/", authorize("finance.view"), ctrl.list);
router.post("/", authorize("finance.edit"), ctrl.create);
router.patch("/:id", authorize("finance.edit"), validateId(), ctrl.update);
router.delete("/:id", authorize("finance.edit"), validateId(), ctrl.remove);

module.exports = router;
