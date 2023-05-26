const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const flagURLs = require("country-flags-svg");
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();
const messageBird = require("messagebird")("W2tTRdqV8xxNjMYhIXSX3eEY6");

const activatekey = "accountactivatekey123";
const nodemailer = require("nodemailer");
const request = require("request");
const smtpTransport = require("nodemailer-smtp-transport");
const otpGenerator = require("otp-generator");
const fast2sms = require("fast-two-sms");
const unirest = require("unirest");
const transaction = require("./transaction");
const User = require("../models/user");
const everydayboys = require("./addlivescores");

const req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
const matches = require("./matchDB-controller");
const matchestwo = require("./matchDB-controllerthree");
const addingteam = require("./addplayersm");
const addlivenew = require("./addlivescoresnewone");
const addlivescoresnew = require("./addlivescoresdetailsnew");
const livedetails = require("./addlivedetailsnew");
const addplayers = require("./addplayerstwo");
const livescore = require("./addlivescoresdetails");
const teamstandings = require("./updateteam");
const addLiveCommentary = require("./firebase");
const addIds = require("./addMatchIds");

const api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
const transporter = nodemailer.createTransport(
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
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addmatchtodbtwo", async (req, res) => {
  try {
    matchestwo.addMatchtoDb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
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
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addlivecommentary", async (req, res) => {
  try {
    await addLiveCommentary.addLivecommentary();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addteams", async (req, res) => {
  try {
    await addingteam.addPlayers();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addlivenew", async (req, res) => {
  try {
    await addlivenew.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/newscores", async (req, res) => {
  try {
    await addlivescoresnew.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

module.exports = router;
