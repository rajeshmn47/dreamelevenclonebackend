const mongoose = require("mongoose");

const apiRequestSchema = new mongoose.Schema(
  {
    matchId: { type: Number, required: true },     // Cricbuzz matchId
    apiKey: { type: String, required: true },      // key used for this request
    timestamp: { type: Date, default: Date.now }   // when request was made
  },
  { timestamps: true }
);

const ApiRequest = mongoose.model("ApiRequest", apiRequestSchema);
module.exports = ApiRequest;
