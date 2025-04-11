// models/Config.js
const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tier: { type: String, required: true, default: 'free' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Config", configSchema);

