const mongoose = require("mongoose");
const crypto = require("crypto");

const matchSchema = new mongoose.Schema(
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

    format: {
      type: String,
      enum: [
        'test',
        'odi',
        't20',
        't10'
      ]
    },

    type: {
      type: String,
      enum: [
        'i',
        'd',
        'l'
      ]
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
    teamHomeFlagUrl: {
      type: String,
      trim: true,
      default: "",
    },
    teamAwayFlagUrl: {
      type: String,
      trim: true,
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
          required: false,
          lowercase: true,
          default: ""
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
          required: false,
          lowercase: true,
          default: ""
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

    seriesId: {
      type: String,
      required: true, // If every match should belong to a series
      trim: true,
      default: "",
    },

    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",   // references Series collection
      required: true,
    },

    importance: {
      type: String,
      enum: ["very_high", "high", "medium", "low"],
      default: "medium"
    }
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model("Match", matchSchema);
module.exports = Match;
