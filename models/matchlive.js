const mongoose = require("mongoose");
const crypto = require("crypto");

const matchDetailsThirdSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    format: {
      type: String,
      enum: [
        'test',
        'odi',
        't20',
        't10'
      ],
      default: 't20'
    },
    type: {
      type: String,
      enum: [
        'i',
        'd',
        'l'
      ],
      default: 'i'
    },
    teamHomeId: {
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
    teamAwayId: {
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
        points: {
          type: Number,
          required: true,
          default: 4,
        },
        runs: {
          type: Number,
          required: true,
          default: 0,
        },

        balls: {
          type: Number,
          required: true,
          default: 0,
        },

        fours: {
          type: Number,
          required: true,
          default: 0,
        },

        sixes: {
          type: Number,
          required: true,
          default: 0,
        },

        strikeRate: {
          type: Number,
          required: true,
          default: 0.0,
        },

        howOut: {
          type: String,
        },

        overs: {
          type: Number,
          required: true,
          default: 0,
        },

        maidens: {
          type: Number,
          required: true,
          default: 0,
        },

        runsConceded: {
          type: Number,
          required: true,
          default: 0,
        },

        wickets: {
          type: Number,
          required: true,
          default: 0,
        },

        economy: {
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
        runs: {
          type: Number,
          required: true,
          default: 0,
        },

        balls: {
          type: Number,
          required: true,
          default: 0,
        },

        fours: {
          type: Number,
          required: true,
          default: 0,
        },

        sixes: {
          type: Number,
          required: true,
          default: 0,
        },

        strikeRate: {
          type: Number,
          required: true,
          default: 0.0,
        },

        howOut: {
          type: String,
        },

        overs: {
          type: Number,
          required: true,
          default: 0,
        },

        maidens: {
          type: Number,
          required: true,
          default: 0,
        },

        runsConceded: {
          type: Number,
          required: true,
          default: 0,
        },

        wickets: {
          type: Number,
          required: true,
          default: 0,
        },

        economy: {
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

    titleFI: {
      type: String,
    },

    oversFI: {
      type: Number,
    },

    runFI: {
      type: Number,
    },

    wicketsFI: {
      type: String,
    },

    fowFI: {
      type: String,
    },

    extrasDetailFI: {
      type: String,
    },

    titleSI: {
      type: String,
    },

    oversSI: {
      type: Number,
    },

    runSI: {
      type: Number,
    },

    wicketsSI: {
      type: String,
    },

    fowSI: {
      type: String,
    },

    extrasDetailSI: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MatchLiveDetails = mongoose.model(
  "MatchLiveDetails",
  matchDetailsThirdSchema
);
module.exports = MatchLiveDetails;
