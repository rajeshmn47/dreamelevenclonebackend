const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },

  teamName: { type: String, required: true },
  shortName: { type: String },
  image: { type: String },
  flagUrl: {
    type: String,
    trim: true,
  },
  // One of: international, domestic, league
  type: {
    type: String,
    enum: ["international", "domestic", "league"],
    required: true,
  },

  // Applies to international and domestic teams
  country: {
    type: String,
    default: "",
  },

  // Applies to league teams
  league: {
    type: String,
    default: "", // e.g., IPL, BBL, PSL
  },

  // Optional: association to state or region for domestic
  region: {
    type: String,
    default: "", // e.g., "Karnataka", "Punjab"
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("CricketTeam", teamSchema);
