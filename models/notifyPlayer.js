const mongoose = require("mongoose");

const SelectedPlayerSchema = new mongoose.Schema({
  player_id: { type: Number, required: true },
  batting: { type: Boolean, default: false },
  bowling: { type: Boolean, default: false },
  battingNotified: { type: Boolean, default: false },
  bowlingNotified: { type: Boolean, default: false }
}, { _id: false });

const NotifyPlayerSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  players: { type: [SelectedPlayerSchema], required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NotifyPlayer", NotifyPlayerSchema);

