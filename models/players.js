const mongoose = require("mongoose");
const crypto = require("crypto");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    firstname: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    lastname: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    image: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },

    dateofbirth: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "",
    },

    id: {
      type: Number,
      required: true,
    },

    country_id: {
      type: Number,
      required: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;
