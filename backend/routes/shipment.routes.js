const router = require("express").Router();
const ctrl = require("../controllers/shipment.controller");
const { protect, authorize } = require("../middleware/auth");
const validateId = require("../middleware/validateId");

router.use(protect);
router.get("/", authorize("shipments.view"), ctrl.list);
router.get("/order/:id", authorize("shipments.view"), validateId(), ctrl.forOrder);
router.get("/:id", authorize("shipments.view"), validateId(), ctrl.get);
router.post("/", authorize("shipments.edit"), ctrl.create);
router.patch("/:id", authorize("shipments.edit"), validateId(), ctrl.update);
router.delete("/:id", authorize("shipments.edit"), validateId(), ctrl.remove);
router.post("/:id/documents", authorize("shipments.edit"), validateId(), ctrl.addDocument);
router.delete("/:id/documents/:docId", authorize("shipments.edit"), validateId(), validateId("docId"), ctrl.removeDocument);

module.exports = router;
