const mongoose = require("mongoose");
const crypto = require("crypto");

const teamSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },

    teamHomeName: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    teamAwayName: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    teamHomeCode: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    teamAwayCode: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    date: {
      type: Date,
      required: true,
    },

    matchTitle: {
      type: String,
      required: true,
    },

    contestId: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
