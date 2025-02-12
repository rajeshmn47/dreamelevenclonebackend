const mongoose = require("mongoose");
const crypto = require("crypto");

const postSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
            unique: true
        },
        age: {
            type: String,
            required: false
        },
        team: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
    }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;