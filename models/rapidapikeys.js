const mongoose = require("mongoose");

const rapidApiKeySchema = new mongoose.Schema(
  {
    apiKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const RapidApiKey = mongoose.model("RapidApiKey", rapidApiKeySchema);
module.exports = RapidApiKey;