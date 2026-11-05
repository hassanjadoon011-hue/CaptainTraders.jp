const router = require("express").Router();
const ctrl = require("../controllers/customer.controller");
const { protect, authorize } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.get("/", authorize("customers.view"), ctrl.list);
router.get("/match", authorize("customers.view"), ctrl.match); // above "/:id"
router.get("/:id", authorize("customers.view"), validateId(), ctrl.get);
router.post("/", authorize("customers.edit"), ctrl.create);
router.patch("/:id", authorize("customers.edit"), validateId(), ctrl.update);
router.delete("/:id", authorize("customers.delete"), validateId(), ctrl.remove);

module.exports = router;
