const mongoose = require("mongoose");

const contestTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    prize: {
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
    entryFee: {
      type: Number,
      required: true,
    },
    prizes: {
      type: [
        {
          rank: {
            type: Number,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
        },
      ], // Array of objects to store the list of prizes based on rank
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContestType = mongoose.model("ContestType", contestTypeSchema);
module.exports = ContestType;