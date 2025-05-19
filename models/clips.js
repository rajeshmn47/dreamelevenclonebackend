const mongoose = require("mongoose");

const clipSchema = new mongoose.Schema({
  over: String,
  commentary: String,
  event: String,
  clip: String,
  batsman: String,
  bowler: String,
  duration: Number,
  createdAt: { type: Date, default: Date.now },
});

const Clip = mongoose.model("Clip", clipSchema);
module.exports =Clip;