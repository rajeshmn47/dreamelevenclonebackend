const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // who triggered it
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who will receive
    recipientType: { type: String, enum: ["user", "admin"], required: true }, // type of recipient
    type: {
      type: String,
      enum: ["kyc", "deposit", "withdraw", "general"],
      default: "general",
    },
    title: { type: String, required: true }, // short title
    message: { type: String }, // optional detailed message
    read: { type: Boolean, default: false }, // has recipient seen it
    targetId: { type: mongoose.Schema.Types.ObjectId }, // link to related entity (transaction, KYC, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
