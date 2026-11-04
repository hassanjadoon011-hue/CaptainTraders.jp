const mongoose = require("mongoose");

// Rejects /:id (or another param) that is not a valid MongoDB id
module.exports = (param = "id") => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};
