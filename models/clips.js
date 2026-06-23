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
  league: String,
  format: String,
  season: String,
  duration: Number,
  embedding: {
    type: [Number],   // vector stored here
    default: undefined,
  },
  reported: { type: Boolean, default: false }, // simple true/false
  flag: {
    isFlagged: { type: Boolean, default: false },
    reason: { type: String, trim: true }, // e.g. label_conflict, video_mismatch, manual
    details: { type: String, trim: true }, // optional free-text info
    conflictFields: [{ type: String, trim: true }], // which label fields conflicted
    flaggedAt: { type: Date },
    reviewStatus: {
      type: String,
      enum: ["pending", "fixed", "dismissed"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
  },
  conditionsCount: { type: Number, default: 0 },
  passesTwoConditions: { type: Boolean, default: false },
  hasAnyDuplicate: { type: Boolean, default: false },
  duplicateDetails: {
    shotType: [String],
    direction: [String],
    ballType: [String],
    lengthType: [String]
  },
  labels: {
    shotType: { type: String },
    direction: { type: String },
    ballType: { type: String },
    lengthType: { type: String },
    connection: { type: String },
    slowball: { type: String },
    lofted: { type: Boolean, default: false },
    comesDown: { type: String },
    powerplay: { type: String },
    dropped: { type: Boolean, default: false },
    droppedBy: { type: String, default: '' },
    runout: { type: Boolean, default: false },
    runoutBy: { type: String, default: '' },
    catch: { type: Boolean, default: false },
    catchBy: { type: String, default: '' },
    stumpedBy: { type: String, default: '' },
    shotElevation: { type: String, default: '' },
    variation: { type: String, default: 'normal', enum: ["slow", "fast", "normal"] },
    wicketType: { type: String, enum: ['bowled', 'caught', 'caught_bowled', 'runout', 'stumped', 'lbw', 'hitwicket', 'obstructingthefield', 'retiredhurt', 'timedout'] }
  },
  // Add this field anywhere in your schema
  missingClip: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
});

const Clip = mongoose.model("Clip", clipSchema);
module.exports = Clip;
