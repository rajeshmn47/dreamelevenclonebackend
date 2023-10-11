const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
  {
    amount: {
      type: String,
      trim: true,
      required: true,
    },

    upiId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
      default:""
    },

    isWithdrawCompleted: {
      type: Boolean,
      trim: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Withdraw = mongoose.model("Withdraw", withdrawSchema);
module.exports = Withdraw;
