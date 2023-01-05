const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },

    totalSpots: {
      type: Number,
      required: true,
    },

    numWinners: {
      type: Number,
      required: true,
    },

    spotsLeft: {
      type: Number,
      required: true,
    },

    teamsId: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    matchId: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    prizeDetails: [
      {
        prize: {
          type: Number,
        },
        prizeHolder: {
          type: String,
        },
      },
    ],

    admin: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "Server-Domino-Beton",
    },

    userIds: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Contest = mongoose.model("Contest", contestSchema);
module.exports = Contest;
