const mongoose = require("mongoose");
const crypto = require("crypto");

const fMatchDetailsSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    teamHomeId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
      default: "",
    },
    teamAwayId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
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
        points: {
          type: Number,
          required: true,
          default: 4,
        },
        goals: {
          type: Number,
          required: true,
          default: 0,
        },

        assists: {
          type: Number,
          required: true,
          default: 0,
        },

        chanceCreated: {
          type: Number,
          required: true,
          default: 0,
        },

        shotTarget: {
          type: Number,
          required: true,
          default: 0,
        },

        passCompleted: {
          type: Number,
          required: true,
          default: 0.0,
        },

        tackle: {
          type: String,
        },

        interceptive: {
          type: Number,
          required: true,
          default: 0,
        },

        saves: {
          type: Number,
          required: true,
          default: 0,
        },

        penalty: {
          type: Number,
          required: true,
          default: 0,
        },

        cleanSheet: {
          type: Number,
          required: true,
          default: 0,
        },

        yellowCard: {
          type: Number,
          required: true,
          default: 0.0,
        },

        redCard: {
          type: Number,
          required: true,
          default: 0.0,
        },
        ownGoal: {
          type: Number,
          required: true,
          default: 0.0,
        },
        goalsConceded: {
          type: Number,
          required: true,
          default: 0.0,
        },
        penaltyMissed: {
          type: Number,
          required: true,
          default: 0.0,
        },

        position: {
          type: String,
          trim: true,
          required: false,
          lowercase: true,
          default: "",
        },

        batOrder: {
          type: Number,
          default: -1,
        },
      },
    ],

    teamAwayPlayers: [
      {
        playerId: {
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
        playerName: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
        },

        points: {
          type: Number,
          required: true,
          default: 4,
        },
        goals: {
          type: Number,
          required: true,
          default: 0,
        },

        assists: {
          type: Number,
          required: true,
          default: 0,
        },

        chanceCreated: {
          type: Number,
          required: true,
          default: 0,
        },

        shotTarget: {
          type: Number,
          required: true,
          default: 0,
        },

        passCompleted: {
          type: Number,
          required: true,
          default: 0.0,
        },

        tackle: {
          type: String,
        },

        interceptive: {
          type: Number,
          required: true,
          default: 0,
        },

        saves: {
          type: Number,
          required: true,
          default: 0,
        },

        penalty: {
          type: Number,
          required: true,
          default: 0,
        },

        cleanSheet: {
          type: Number,
          required: true,
          default: 0,
        },

        yellowCard: {
          type: Number,
          required: true,
          default: 0.0,
        },

        redCard: {
          type: Number,
          required: true,
          default: 0.0,
        },
        ownGoal: {
          type: Number,
          required: true,
          default: 0.0,
        },
        goalsConceded: {
          type: Number,
          required: true,
          default: 0.0,
        },
        penaltyMissed: {
          type: Number,
          required: true,
          default: 0.0,
        },

        position: {
          type: String,
          trim: true,
          required: false,
          lowercase: true,
          default: "",
        }
      },
    ],

    date: {
      type: Date,
      required: true,
    },

    inPlay: {
      type: String,
    },

    status: {
      type: String,
    },

    toss: {
      type: String,
    },

    result: {
      type: String,
    },

    transaction: {
      type: Boolean,
      default: false,
    },

    isHomeFirst: {
      type: Boolean,
      required: true,
      default: false,
    },

    title: {
      type: String,
    },

    time: {
      type: Number,
    },

    goalsHome: {
      type: Number,
    },

    goalsAway: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const MatchLiveDetails = mongoose.model(
  "FMatchLive",
  fMatchDetailsSchema
);
module.exports = MatchLiveDetails;
