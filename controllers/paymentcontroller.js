const request = require("request");
const Razorpay = require("razorpay");
const express = require("express");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const crypto = require('crypto');
const axios = require('axios');
const Transaction = require("../models/transaction");
const NewPayment = require("../models/newPayment");
const Withdraw = require("../models/withdraw");
const router = express.Router();
const User = require("../models/user");
const { ObjectId } = mongoose.Types;

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
      userId: req.body.uidfromtoken
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
    let depositse = await NewPayment.find({
      verified: false
    });
    let deposits = await NewPayment.aggregate([
      {
        $match: { verified: false }
      },
      {
        $match: { userId: { $type: "string", $ne: "" } } // filter out empty userId
      },
      {
        $addFields: {
          userObjId: { $toObjectId: "$userId" } // convert string -> ObjectId
        }
      },
      {
        $lookup: {
          from: "users",              // collection name (check in MongoDB, usually "users")
          localField: "userObjId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          amount: 1,
          utr: 1,
          recieptUrl: 1,
          verified: 1,
          createdAt: 1,
          user: 1
        }
      }
    ]);
    return res.status(200).json({
      message: "Successfully Fetched",
      deposits: deposits
    });
  } catch (err) {
    console.log(err, 'err')
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.get("/approve", async (req, res) => {
  try {
    let deposit;
    if (mongoose.Types.ObjectId.isValid(req.query.depositId)) {
      deposit = await NewPayment.findById(req.query.depositId);
      console.log(deposit, 'deposit')
      deposit.verified = true;
      await deposit.save();
      // Doubt in this part, is request is synchronous or non synchronous?
    }
    let userId = null;
    userId = new ObjectId(deposit.userId)
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      console.log(user, 'user')

      if (user) {
        user.wallet = user.wallet + parseInt(deposit.amount);
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
      //user.wallet = user.wallet - req.body.amount;
      //await user.save();
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
    const user = await User.findById(withdraw.userId)
    user.wallet = user.wallet - withdraw.amount;
    await user.save();
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
