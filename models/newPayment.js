const mongoose = require("mongoose");

const newPaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: String,
      trim: true,
      required: true,
    },

    utr: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      default: ""
    },

    recieptUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    verified: {
      type: Boolean,
      trim: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NewPayment = mongoose.model("NewPayment", newPaymentSchema);
module.exports = NewPayment;
