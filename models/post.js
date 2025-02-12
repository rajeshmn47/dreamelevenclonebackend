const mongoose = require("mongoose");
const crypto = require("crypto");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false,
      unique: true
    },
    imgUrl: {
      type: String,
      required: false
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: [{
      commentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      commentText: {
        type: String,
        trim: true,
        required: false,
        lowercase: true
      },
      date: {
        type: Date,
        default: Date.now(),
        required: false
      }
    }],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
