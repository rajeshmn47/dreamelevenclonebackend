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
const transaction = require("./transaction_details_controller");
var nodemailer = require("nodemailer");
const request = require("request");
var smtpTransport = require("nodemailer-smtp-transport");
const otpGenerator = require("otp-generator");
const fast2sms = require("fast-two-sms");
var unirest = require("unirest");
var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
const matches = require("./controllers/matchDB-controller");
const livedetails = require("./controllers/addlivedetailsnew");
const addplayers = require("./controllers/addplayerstwo");
const livescore = require("./controllers/addlivescoresdetails");
const teamstandings = require("./controllers/updateteam");
const comment = require("./controllers/addCommentary");
const addIds = require("./controllers/addMatchIds");
const transaction = require("./controllers/transaction");

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

router.post("/addlivedetails", async (req, res) => {
  try {
    livedetails.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
  }
});

router.post("/addlivescore", async (req, res) => {
  try {
    livescore.addLivescoretodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log("Error : " + err);
  }
});

module.exports = router;
