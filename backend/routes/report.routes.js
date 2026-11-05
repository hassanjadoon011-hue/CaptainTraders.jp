const router = require("express").Router();
const ctrl = require("../controllers/report.controller");
const { protect, authorize } = require("../middleware/auth");

// Financial reports: Owner and Manager only (finance.view)
router.use(protect, authorize("finance.view"));
router.get("/profit-loss", ctrl.profitAndLoss);
router.get("/vehicles", ctrl.vehicles);
router.get("/countries", ctrl.countries);
router.get("/inventory", ctrl.inventory);
router.get("/receivables", ctrl.receivables);

module.exports = router;
