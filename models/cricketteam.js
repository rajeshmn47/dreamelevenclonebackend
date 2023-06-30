const mongoose = require("mongoose");
const crypto = require("crypto");

const cricketteamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    teamId: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },
    players: [
      {
        playerId: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
        },
        playerName: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
        },
        image: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
          default: "",
        },
        position: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
        },
        batOrder: {
          type: Number,
          default: -1,
        },
        default: "",
      },
    ],
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CricketTeam = mongoose.model("CricketTeam", cricketteamSchema);
module.exports = CricketTeam;
