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
      lowercase: true,
    },

    lastname: {
      type: String,
      trim: true,
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
      lowercase: true,
      default: "",
    },

    id: {
      type: Number,
      required: true,
      unique: true
    },

    country_id: {
      type: Number,
      default: "",
    },

    flagUrls: [
      { type: String }
    ],

    teamId: {
      type: String,
      default: "",
    },

    position: {
      type: String,
      default: "",
    },

    teamIds: [
      {
        type: String,
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;
