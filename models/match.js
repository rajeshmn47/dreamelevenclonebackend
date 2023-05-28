const mongoose = require("mongoose");
const crypto = require("crypto");

const matcheSchema = new mongoose.Schema(
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

    teamHomeId: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },

    teamAwayCode: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
    teamAwayId: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },
    teamHomePlayers: [
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
    teamAwayPlayers: [
      {
        playerId: {
          type: String,
          trim: true,
          required: false,
          lowercase: true,
          default: 1,
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
    enddate: {
      type: Date,
      required: true,
      default: Date.now(),
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

const Match = mongoose.model("Matchtwo", matcheSchema);
module.exports = Match;
