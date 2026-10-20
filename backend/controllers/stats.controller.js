const Car = require("../models/Car");
const Message = require("../models/Message");

const getStats = async (req, res, next) => {
  try {
    const [cars, messages] = await Promise.all([
      Car.countDocuments(),
      Message.countDocuments(),
    ]);

    res.json({ success: true, data: { cars, messages } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };