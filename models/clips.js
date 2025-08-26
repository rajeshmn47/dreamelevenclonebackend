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
  createdAt: { type: Date, default: Date.now },
});

const Clip = mongoose.model("Clip", clipSchema);
module.exports =Clip;
