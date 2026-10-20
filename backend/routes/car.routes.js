const router = require("express").Router();
const carController = require("../controllers/car.controller");
const { protect } = require("../middleware/auth");
const mongoose = require("mongoose");

// ID validation middleware
const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  next();
};

// PUBLIC routes
router.get("/", carController.getAllCars);
router.get("/:id", validateId, carController.getCarById);

// PROTECTED routes (require login token)
router.post("/", protect, carController.createCar);
router.put("/:id", protect, validateId, carController.updateCar);
router.delete("/:id", protect, validateId, carController.deleteCar);

module.exports = router;