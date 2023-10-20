const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
const request = require("request");
const Razorpay = require("razorpay");
const express = require("express");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const Transaction = require("../models/transaction");
const NewPayment = require("../models/newPayment");
const Withdraw = require("../models/withdraw");
const router = express.Router();
const User = require("../models/user");

dotenv.config();

const instance = new Razorpay({
  key_id: "rzp_test_3FLuLisPuowtZP",
  key_secret: "paGWw3r0v1ty8K3U9YDxOu8f",
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
      async (err, res, body) => {
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

router.get("/alltransactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    return res.status(200).send(transactions);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
});

router.patch("/addamount", async (req, res) => {
  console.log(req.body);
  try {
    const amount = parseInt(req.body.amount);
    const user = await User.findOne({ _id: req.body.id });
    user.wallet += amount;
    user.totalAmountAdded += amount;
    await user.save();
    await Transaction.create({
      userId: user._id,
      action: "deposit",
      amount: amount,
      transactionId: "id",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
  res.status(200).send("OK");
});

router.post("/deposit", async (req, res) => {
  console.log(req.body, "deposit");
  try {
    await NewPayment.create({
      recieptUrl: req.body.recieptUrl,
      utr: req.body.utr,
      amount: req.body.amount,
    });
    return res.status(200).json({
      message: "Successfully Saved",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.get("/depositData", async (req, res) => {
  console.log(req.body, "deposit");
  try {
    let deposits = await NewPayment.find({
      verified: false
    });
    return res.status(200).json({
      message: "Successfully Fetched",
      deposits: deposits
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.get("/approve", async (req, res) => {
  console.log(req.query, "deposit");

  try {
    if (mongoose.Types.ObjectId.isValid(req.query.depositId)) {
      const deposit = await NewPayment.findById(req.query.depositId);
      console.log(deposit, 'deposit')
      deposit.verified = true;
      await deposit.save();
      const options = {
        method:"POST",
        url: "https://graph.facebook.com/v17.0/154018731120852/messages",
        headers: {
          'Authorization': `Bearer ${process.env.whatsappkey}`,
          useQueryString: true,
          'Content-Type': 'application/json'
        },
        body:`{ \"messaging_product\": \"whatsapp\", \"to\": \"919380899596\", \"type\": \"template\", \"template\": { \"name\": \"hello_woreeld\", \"language\": { \"code\": \"en_US\" } } }`
      };
      // Doubt in this part, is request is synchronous or non synchronous?
      const promise = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          }
          // console.log(body)
          const s = JSON.parse(body);
          resolve(s);
        });
      });
      promise
        .then(async (s) => {
        })
    }
    if (mongoose.Types.ObjectId.isValid(req.query.userId)) {
      const user = await User.findById(req.query.userId);
      console.log(user, 'user')

      if (user) {
        user.wallet = user.wallet + deposit.amount;
        await user.save();
        return res.status(200).json({
          message: "Successfully Saved",
          deposits: deposit
        });
      }
    }
    else {
      return res.status(200).json({
        message: "User do not exist"
      });
    }
  } catch (err) {
    console.log(err, 'err')
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.post("/withdraw", async (req, res) => {
  console.log(req.body, "withdraw");
  try {
    const user = await User.findById(req.body.userId);
    if (user.wallet > req.body.amount) {
      await Withdraw.create({
        upiId: req.body.upiId,
        amount: req.body.amount,
        userId:req.body.userId
      });
      return res.status(200).json({
        message: "Successfully Saved",
      });
    }
    else {
      return res.status(400).json({
        message: "your balance is less than the amount requested!",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.get("/withdrawData", async (req, res) => {
  console.log(req.body, "deposit");
  try {
    let withdrawals = await Withdraw.find({
      verified: false
    });
    return res.status(200).json({
      message: "Successfully Fetched",
      withdrawals: withdrawals
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.get("/approveWithdraw", async (req, res) => {
  console.log(req.body, "withdraw");
  try {
    const withdraw = await Withdraw.findById(req.query.withdrawId);
    withdraw.verified = true;
    const user = await User.findById(req.query.userId);
    user.wallet = user.wallet - withdraw.amount;
    await user.save();
    return res.status(200).json({
      message: "Approved Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

module.exports = router;
