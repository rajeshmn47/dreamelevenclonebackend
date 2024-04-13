const mongoose = require("mongoose");
const crypto = require("crypto");

const detailScores = new mongoose.Schema(
  {
    matchId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    firstTeam: {
      type: String,
      trim: true
    },
    secondTeam: {
      type: String,
      trim: true
    },
    firstInningsBalls: [
      {
        ballNbr: {
          type: Number,
          trim: true,
          required: true,
          lowercase: true,
        },
        runs: {
          type: Number,
          trim: true,
          required: true,
          lowercase: true,
        },
        event: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
          default: "",
        }
      },
    ],
    secondInningsBalls: [
      {
        ballNbr: {
          type: Number,
          trim: true,
          required: true,
          lowercase: true,
        },
        runs: {
          type: Number,
          trim: true,
          required: true,
          lowercase: true,
        },
        event: {
          type: String,
          trim: true,
          required: true,
          lowercase: true,
          default: "",
        }
      },
    ]
  },
  {
    timestamps: true,
  }
);

const DetailScores = mongoose.model(
  "DetailScores",
  detailScores
);
module.exports = DetailScores;
