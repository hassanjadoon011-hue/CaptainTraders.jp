const router = require("express").Router();
const carController = require("../controllers/car.controller");
const { protect, authorize } = require("../middleware/auth");
const mongoose = require("mongoose");

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};

// PUBLIC routes
router.get("/", carController.getAllCars);
router.get("/meta", carController.getFilterOptions); // must stay above "/:id"
router.get("/:id", validateId, carController.getCarById);

// PROTECTED routes (admin login required)
router.post("/", protect, authorize("cars.create"), carController.createCar);
router.put("/:id", protect, authorize("cars.edit"), validateId, carController.updateCar);
router.delete("/:id", protect, authorize("cars.delete"), validateId, carController.deleteCar);

module.exports = router;