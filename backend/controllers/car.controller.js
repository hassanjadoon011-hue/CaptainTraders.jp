const carService = require("../services/car.service");

const getAllCars = async (req, res, next) => {
  try {
    const result = await carService.getAllCars(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const data = await carService.getFilterOptions({ make: req.query.make });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCarById = async (req, res, next) => {
  try {
    // The public car page asks for ?view=1 so only real visits are counted
    const countView = req.query.view === "1";
    const car = await carService.getCarById(req.params.id, { countView });
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

module.exports = { getAllCars, getFilterOptions, getCarById, createCar, updateCar, deleteCar };