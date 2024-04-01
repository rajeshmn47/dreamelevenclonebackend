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
const crypto = require('crypto');
const axios = require('axios');
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
      async (err, response, body) => {
        if (err) {
          return res.status(500).json({
            message: "Something Went Wrong",
          });
        }
        return res.status(200).json(body);
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
  try {
    if (mongoose.Types.ObjectId.isValid(req.query.depositId)) {
      const deposit = await NewPayment.findById(req.query.depositId);
      console.log(deposit, 'deposit')
      deposit.verified = true;
      await deposit.save();
      const options = {
        method: "POST",
        url: "https://graph.facebook.com/v17.0/154018731120852/messages",
        headers: {
          'Authorization': `Bearer ${process.env.whatsappkey}`,
          useQueryString: true,
          'Content-Type': 'application/json'
        },
        body: `{ \"messaging_product\": \"whatsapp\", \"to\": \"919380899596\", \"type\": \"template\", \"template\": { \"name\": \"hello_woreeld\", \"language\": { \"code\": \"en_US\" } } }`
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
    const user = await User.findById(req.body.uidfromtoken);
    if (parseInt(user.wallet) > parseInt(req.body.amount)) {
      await Withdraw.create({
        amount: req.body.amount,
        userId: req.body.uidfromtoken
      });
      user.wallet = user.wallet - req.body.amount;
      await user.save();
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
    let withdrawals = await Withdraw.aggregate(
      [{ $match: { isWithdrawCompleted: false } },
      {
        $lookup: {
          from: "users",//your schema name from mongoDB
          localField: "userId", //user_id from user(main) model
          foreignField: "_id",//user_id from user(sub) model
          as: "user"//result var name
        }
      },]
    )
    // //const testproperties = await Booking.aggregate(
    //  [{ $match: { propertyId: new ObjectId(req.params.propertyId) } },
    //   {
    //  $lookup: {
    //     from: "users",//your schema name from mongoDB
    //     localField: "user", //user_id from user(main) model
    //      foreignField: "_id",//user_id from user(sub) model
    //      as: "users",//result var name
    //  }
    // },]
    // )
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
    withdraw.isWithdrawCompleted = true;
    await withdraw.save();
    return res.status(200).json({
      message: "Approved Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.delete("/withdraw", async (req, res) => {
  console.log(req.body, "withdraw");
  try {
    const withdraw = await Withdraw.remove(req.query.withdrawId);
    return res.status(200).json({
      message: "Deleted Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.delete("/deleteAllWithdraw", async (req, res) => {
  console.log(req.body, "withdraw");
  try {
    const withdraw = await Withdraw.deleteMany();
    return res.status(200).json({
      message: "Deleted Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

const { salt_key, merchant_id } = { salt_key: "ysyusahu7638hjsbjhs", merchant_id: "6e96ea17-536e-4091-bf20-ea835f52ec11" }

router.post("/phonepePayment", async (req, res) => {
  try {
    const merchantTransactionId = req.body.transactionId;
    const data = {
      merchantId: merchant_id,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: req.body.MUID,
      name: req.body.name,
      amount: req.body.amount * 100,
      redirectUrl: `http://localhost:5000/api/status/${merchantTransactionId}`,
      redirectMode: 'POST',
      mobileNumber: req.body.number,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadMain + '/pg/v1/pay' + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
    const options = {
      method: 'POST',
      url: prod_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: payloadMain
      }
    };

    axios.request(options).then(function (response) {
      console.log(response.data)
      return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
    })
      .catch(function (error) {
        console.error(error);
      });

  } catch (error) {
    res.status(500).send({
      message: error.message,
      success: false
    })
  }
})

router.post("/phonepeStatus", async (req, res) => {
  const merchantTransactionId = res.req.body.transactionId
  const merchantId = res.req.body.merchantId

  const keyIndex = 1;
  const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + "###" + keyIndex;

  const options = {
    method: 'GET',
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': `${merchantId}`
    }
  };

  // CHECK PAYMENT TATUS
  axios.request(options).then(async (response) => {
    if (response.data.success === true) {
      const url = `http://localhost:3000/success`
      return res.redirect(url)
    } else {
      const url = `http://localhost:3000/failure`
      return res.redirect(url)
    }
  })
    .catch((error) => {
      console.error(error);
    });
});


module.exports = router;
