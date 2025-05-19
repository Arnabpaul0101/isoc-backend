const mongoose = require("mongoose");

const PRPointsSchema = new mongoose.Schema({
  prId: { type: String, required: true, unique: true },
  title: String,
  username: { type: String, required: true },
  points: { type: Number, default: 0 },
  assigned: { type: Boolean, default: false },
});

module.exports = mongoose.model("PRPoints", PRPointsSchema);
