const carService = require("../services/car.service");

const getAllCars = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      sort,
      make,
      fuelType,
      bodyType,
      yearFrom,
      yearTo,
      minPrice,
      maxPrice,
      status,
      search,
    } = req.query;

    const result = await carService.getAllCars({
      page,
      limit,
      sort,
      make,
      fuelType,
      bodyType,
      yearFrom,
      yearTo,
      minPrice,
      maxPrice,
      status,
      search,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getCarById = async (req, res, next) => {
  try {
    const car = await carService.getCarById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    res.json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

const createCar = async (req, res, next) => {
  try {
    const car = await carService.createCar(req.body);
    res.status(201).json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

const updateCar = async (req, res, next) => {
  try {
    const car = await carService.updateCar(req.params.id, req.body);
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    res.json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

const deleteCar = async (req, res, next) => {
  try {
    const car = await carService.deleteCar(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    res.json({ success: true, message: "Car deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllCars, getCarById, createCar, updateCar, deleteCar };