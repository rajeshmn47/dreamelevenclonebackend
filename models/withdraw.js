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
      required: false
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserNew'
    },

    isWithdrawCompleted: {
      type: Boolean,
      trim: true,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Withdraw = mongoose.model("Withdraw", withdrawSchema);
module.exports = Withdraw;

