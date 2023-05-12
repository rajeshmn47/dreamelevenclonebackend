const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const flagURLs = require("country-flags-svg");
var express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const everydayboys = require("./addlivescores");
const messageBird = require("messagebird")("W2tTRdqV8xxNjMYhIXSX3eEY6");
const User = require("../models/user");
const activatekey = "accountactivatekey123";
const transaction = require("./transaction");
var nodemailer = require("nodemailer");
const request = require("request");
var smtpTransport = require("nodemailer-smtp-transport");
const otpGenerator = require("otp-generator");
const fast2sms = require("fast-two-sms");
var unirest = require("unirest");
var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
const matches = require("./matchDB-controller");
const matchestwo = require("./matchDB-controllertwo");
const livedetails = require("./addlivedetailsnew");
const addplayers = require("./addplayerstwo");
const livescore = require("./addlivescoresdetails");
const teamstandings = require("./updateteam");
const comment = require("./addCommentary");
const addIds = require("./addMatchIds");

let api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
var transporter = nodemailer.createTransport(
  smtpTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "rajeshmn47@gmail.com",
      pass: "nednygtvvsfgzvex",
    },
  })
);

router.get("/addlivedetails", async (req, res) => {
  try {
    livedetails.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addlivescore", async (req, res) => {
  try {
    livescore.addLivematchtodb();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addplayers", async (req, res) => {
  try {
    addplayers.addPlayers();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/updateteams", async (req, res) => {
  try {
    teamstandings.addTeamstandingstodb();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});
router.get("/addtransaction", async (req, res) => {
  try {
    transaction.startTransaction();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addmatchtodb", async (req, res) => {
  try {
    matches.addMatchtoDb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addmatchids", async (req, res) => {
  try {
    addIds.addMatchIds();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addcommentary", async (req, res) => {
  try {
    comment.addcommentary();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

module.exports = router;
