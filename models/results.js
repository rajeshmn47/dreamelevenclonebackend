const mongoose = require("mongoose");
const crypto = require("crypto");

const results = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },
    regno: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },
    total: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
const Result = mongoose.model("Results", results);
module.exports = Result;
