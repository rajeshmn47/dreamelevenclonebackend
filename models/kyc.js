const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docs: [{ type: String }], // Firebase URLs
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  adminComment: { type: String },
});

module.exports = mongoose.model("Kyc", KycSchema);

