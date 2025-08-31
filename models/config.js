// models/Config.js
const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tier: { type: String, required: true, default: 'free' },
    totalhits: { type: Number, default: 0 },
    frequencies: {
      t20: { type: Number, default: 2 },       // every 2 min
      odi: { type: Number, default: 5 },       // every 5 min
      test: { type: Number, default: 15 },     // every 15 min
      important: { type: Number, default: 1 }, // every 1 min
    },
  },
  { timestamps: true }
);

const Config = mongoose.model("Config", configSchema);
module.exports = Config;

