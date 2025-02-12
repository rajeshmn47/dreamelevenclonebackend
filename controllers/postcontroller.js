const express = require("express");
const Post = require("../models/post");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.post("/post", async (req, res) => {
    const post = await Post.create({
        title: req.body.title,
        imgUrl: req.body.imgUrl,
        postedBy: req.body.uidfromtoken
    });
    res.status(200).json({
        post,
        message: "team created successfully",
    });
});

router.post("/addcomment/:postId", async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.postId, {
        $push: {
            "comments": {
                commentBy: mongoose.Types.ObjectId(req.body.uidfromtoken),
                commentText: req.body.comment, date: Date.now()
            }
        }
    });
    res.status(200).json({
        post,
        message: "team created successfully",
    });
});

router.get("/like/:postId", async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.postId, { $addToSet: { "likes": mongoose.Types.ObjectId(req.body.uidfromtoken) } });
    res.status(200).json({
        post,
        message: "team created successfully",
    });
});

router.get("/allPosts", async (req, res) => {
    //await Post.deleteMany({});
    try {
        let posts = await Post.find().populate("comments.commentBy").populate("postedBy");
        res.status(200).json({
            posts: posts,
            message: "posts obtained successfully",
        });
    }
    catch (e) {
        res.status(400).json({
            message: "failed",
        });
    }
});

router.get("/deletePosts", async (req, res) => {
    let posts = await Post.deleteMany({})
    res.status(200).json({
        posts: posts,
        message: "team created successfully",
    });
});

module.exports = router;
