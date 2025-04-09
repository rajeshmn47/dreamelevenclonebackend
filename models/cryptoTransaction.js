const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userAddress: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["deposit", "withdraw", "send"],
    },
    amount: {
      type: Number,
      required: true,
    },
    txHash: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const CryptoTransaction = mongoose.model("CryptoTransaction", transactionSchema);
module.exports = CryptoTransaction;