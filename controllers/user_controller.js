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

function checkloggedinuser(req, res, next) {
  const tokenheader = req.body.headers || req.headers["servertoken"];

  if (tokenheader) {
    jwt.verify(tokenheader, activatekey, function (err, decoded) {
      if (!err) {
        req.body.uidfromtoken = decoded.userid;
        console.log(decoded);
        console.log("rajesh");
      }
      next();
    });
  } else {
    res.status(200).json({
      success: false,
    });
  }
}

router.post("/register", async (req, res) => {
  console.log(req.body);
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const user1 = new User();
  const userId = req.body.email.split("@")[0];
  user1.userId = userId;
  user1.username = req.body.username;
  user1.email = req.body.email;
  user1.password = req.body.password;
  user1.phonenumber = req.body.phonenumber;
  user1.wallet = 100;
  user1.otp = otp;
  var mailOptions = {
    from: "rajeshmn47@gmail.com",
    to: req.body.email,
    subject: "Sending Email using Node.js[nodemailer]",
    text: `enter this otp ${otp}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  var options = {
    method: "POST",
    url: "https://api.razorpay.com/v1/contacts",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
    },
    body: JSON.stringify({
      name: req.body.username,
      email: req.body.email,
      contact: req.body.phonenumber,
      type: "employee",
      reference_id: "Domino Contact ID 12345",
      notes: {
        random_key_1: "Make it so.",
        random_key_2: "Tea. Earl Grey. Hot.",
      },
    }),
  };
  let contact_id = "";
  let promise = new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) reject(error);
      let s = JSON.parse(response.body);
      console.log(s.id);
      contact_id = s.id;
      console.log(s);
      user1.contact_id = contact_id;
      resolve();
    });
  });
  promise
    .then(async () => {
      console.log("rajesh");
      User.findOne({ email: req.body.email }, async function (err, user) {
        console.log(user, "okvor");
        if (err) {
          console.log("Error in finding user in Sign-in ");
          res.status(200).json({
            message: "something went wrong",
          });
        }

        if (!user) {
          console.log("rajeshkkkkkkssssssssssss");
          transaction.createTransaction(userId, "", 100, "extra cash");
          User.create(user1, async function (err, user) {
            if (err) {
              console.log("rajesh");
              console.log(
                "Error in creating a user while account activation",
                err
              );
              res.status(200).json({
                message: "something went wrong",
              });
            } else {
              var userid = user._id;
              console.log("SignUp successfull!");

              const token = jwt.sign({ userid }, activatekey, {
                expiresIn: "500m",
              });

              res.status(200).json({
                message:
                  "enter otp recieved on your mail to activate your account",
                token: token,
              });
            }
          });
        } else {
          console.log("kuttheee");
          res.status(200).json({
            message: "user already exists",
          });
        }
      });
    })
    .catch((err) => {
      console.log("Error : " + err);
    });
});
router.post("/otp", async (req, res) => {
  console.log(req.body);
  const user = await User.findOne({ email: req.body.email });
  console.log(user.otp, req.body.otp);
  if (parseInt(user.otp) === parseInt(req.body.otp)) {
    user.verified = true;
    let userid = user._id;
    const token = jwt.sign({ userid }, activatekey, {
      expiresIn: "500m",
    });
    user.save(function (err) {
      if (!err) {
        console.log("contact");
      } else {
        console.log("Error: could not save contact ");
        res.status(200).json({
          message: "ure account created successfully u can login",
          token: token,
        });
      }
    });
  } else {
    res.status(200).json({
      message: "ure account failed to create successfully",
    });
  }
});

router.post("/login", async (req, res) => {
  console.log(req.body);
  const user = await User.findOne({ email: req.body.myform.email });
  if (user) {
    if (user.password === req.body.myform.password) {
      var userid = user._id;
      const token = jwt.sign({ userid }, activatekey, {
        expiresIn: "50000000m",
      });
      res.status(200).json({
        message: "success",
        token: token,
        user: user,
      });
    }
  } else {
    res.status(200).json({
      message: "no user exists",
    });
  }
});
router.get("/loaduser", checkloggedinuser, async function (req, res) {
  console.log(req.headers);
  console.log(req.body.uidfromtoken);
  const user = await User.findOne({ _id: { $eq: req.body.uidfromtoken } });
  res.status(200).json({
    message: user,
  });
});
module.exports = router;
