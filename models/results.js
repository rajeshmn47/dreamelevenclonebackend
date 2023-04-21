const mongoose = require("mongoose");
const crypto = require("crypto");

const results = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
    regno: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
    total: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);
const Result = mongoose.model("Resultse", results);
module.exports = Result;
