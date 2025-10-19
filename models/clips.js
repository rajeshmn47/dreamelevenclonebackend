const mongoose = require("mongoose");

const clipSchema = new mongoose.Schema({
  over: String,
  commentary: String,
  event: String,
  subEvent: String,
  clip: String,
  batsman: String,
  bowler: String,
  shotType: String,
  bowlerType: String,
  battingHand: String,
  bowlingHand: String,
  batting_team: String,
  bowling_team: String,
  matchType: String,
  series: String,
  seriesId: String,
  matchId: String,
  season: String,
  duration: Number,
  reported: { type: Boolean, default: false }, // simple true/false
  labels: {
    shotType: { type: String },
    direction: { type: String },
    ballType: { type: String },
    connection: { type: String },
    slowball: { type: String },
    lofted: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
});

const Clip = mongoose.model("Clip", clipSchema);
module.exports = Clip;
