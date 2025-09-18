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
      high: { type: Number, default: 10 },     // every 10 min
      low: { type: Number, default: 60 },      // every 1 hour
      very_high: { type: Number, default: 0.5 } //
    },
  },
  { timestamps: true }
);

const Config = mongoose.model("Config", configSchema);
module.exports = Config;

