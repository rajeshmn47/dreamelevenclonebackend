const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
const Razorpay = require("razorpay");
var express = require("express");
const router = express.Router();
const User = require("../models/user");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const instance = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY_ID,
  key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});

router.get("/createpayment/:amount", (req, res) => {
  console.log("rajesh");
  try {
    const options = {
      amount: Number(req.params.amount) * 100,
      currency: "INR",
      receipt: uuidv4(),
      payment_capture: 0,
    };
    instance.orders.create(options, async (err, order) => {
      if (err) {
        return res.status(500).json({ message: "Something went wrong" });
      }
      return res.status(200).json(order);
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

router.post("/capture/:paymentId/:amount", (req, res) => {
  console.log("rajeevsoori");
  try {
    return request(
      {
        method: "POST",
        url: `https://${process.env.RAZOR_PAY_KEY_ID}:${process.env.RAZOR_PAY_KEY_SECRET}@api.razorpay.com/v1/payments/${req.params.paymentId}/capture`,
        form: {
          amount: Number(req.params.amount) * 100,
          currency: "INR",
        },
      },
      async function (err, res, body) {
        if (err) {
          return res.status(500).json({
            message: "Something Went Wrong",
          });
        }
        return res.json(body);
      }
    );
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.patch("/addamount", async (req, res) => {
  console.log(req.body);
  try {
    const amount = parseInt(req.body.amount);
    const user = await User.findOne({ _id: req.body.id });
    user.wallet = user.wallet + amount;
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }

  res.status(200).send("OK");
});

module.exports = router;
