const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: false,
      unique: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true  
    },
    verified: {
      type: Boolean,
      default: false,
    },
    phonenumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    totalhits: {
      type: Number,
      required: true,
      default: 0,
    },
    totalhitscom: {
      type: Number,
      required: true,
      default: 0,
    },
    matchIds: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    numberOfContestJoined: {
      type: Number,
      required: true,
      default: 0,
    },
    otp: {
      type: Number,
      required: true,
      default: 0,
    },
    numberOfContestWon: {
      type: Number,
      required: true,
      default: 0,
    },
    numberOfTeamsCreated: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmountWon: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmountAdded: {
      type: Number,
      required: true,
      default: 0,
    },
    wallet: {
      type: Number,
      required: true,
      default: 0,
    },
    cryptoWallet: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      default: "https://cdn.sportmonks.com/images/cricket/placeholder.png",
    },
    contact_id: {
      type: String,
      required: false,
      unique: true,
      index: {
        unique: false,
        partialFilterExpression: { contact_id: { $type: "string" } },
      },
    },
    ifsc: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    upiId: {
      type: String,
      default: "",
    },
    fundId: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    fcmtoken: {
      type: String,
    },
    followers: [
      {
        type: String,
        trim: true,
      },
    ],
    following: [
      {
        type: String,
        trim: true,
      },
    ],
    usageTier: {
      type: String,
      enum: ["slow", "medium", "fast", "extremely fast"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
