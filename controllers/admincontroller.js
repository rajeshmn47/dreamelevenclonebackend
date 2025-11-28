const express = require("express");
const Matches = require("../models/match");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const ContestType = require("../models/contestType");
const request = require("request");
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const NewPayment = require("../models/newPayment");
const Withdraw = require("../models/withdraw");
const Transaction = require("../models/transaction");

const router = express.Router();

router.get("/dashboard-data", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

router.get("/sidebar-data", async (req, res) => {
  try {
    // Transactions
    const pendingWithdrawals = await Withdraw.countDocuments({
       status: "pending"
    });

    const pendingDeposits = await NewPayment.countDocuments({
      status: "pending"
    });

    const contests = await ContestType.countDocuments();

    const pendingUsers = await User.find({ verifed: false })
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const oldMatches = await Matches.find({
      date: { $lt: oneMonthAgo }
    });

    const currentDate = new Date();

    const filteredMatches = oldMatches.filter(match => {
      const matchDate = new Date(match.date);
      const matchEndDate = new Date(match.enddate);

      // 1️⃣ Status filter
      let statusPass = false;
      if (currentDate > matchDate) {
        const result = match.matchlive?.[0]?.result?.toLowerCase();
        statusPass = (
          !match.matchlive ||
          !result ||
          (currentDate > matchEndDate && !(result === 'complete' || result === 'abandon'))
        );
      }
      return statusPass
    });

    // Send response
    res.status(200).json({
      success: true,
      data: {
        pendingUsers: pendingUsers?.length,
        pendingWithdrawals: pendingWithdrawals,
        pendingMatches: filteredMatches.length,
        pendingDeposits: pendingDeposits,
        contests: contests
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
});

// --------------------
// GET all users
// --------------------
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// --------------------
// GET single user
// --------------------
router.get("/userseee/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.body.uidfromtoken);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('jey')
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch user
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch matches joined
    let matches = [];
    if (user.matchIds?.length) {
      matches = await Match.find({ matchId: { $in: user.matchIds } })
        .select("matchTitle format date")
        .lean();
    }

    const teampromises = user.matchIds.map((id) =>
      Team.find({
        $and: [{ matchId: id }, { userId: req.body.uidfromtoken }],
      })
    );

    const contestpromises = user.matchIds.map((id) =>
      Contest.find({
        $and: [{ matchId: id }, { userIds: req.body.uidfromtoken }],
      })
    );

    const teamse = await Promise.all(teampromises);
    const contestse = await Promise.all(contestpromises);

    // Send combined response
    res.json({
      user: {
        ...user,
        matches, // add match info
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users/:userId/matches", async (req, res) => {
  try {
    const notAllowed = ["", false, null, 0, undefined, NaN];
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all matches the user participated in
    const matches = await Match.find({ matchId: { $in: user.matchIds } });

    // For each match, get corresponding teams and contests
    const matchData = await Promise.all(
      matches.map(async (match) => {
        const teams = await Team.find({ matchId: match?.matchId, userId: userId });
        const contests = await Contest.find({ matchId: match?.matchId, userIds: userId });
        let won = 0;
        for (let i = 0; i < contests?.length; i++) {
          let totalwon = 0;
          let arr = [];
          for (let j = 0; j < contests[i]?.teamsId?.length; j++) {
            if (
              !notAllowed.includes(contests[i]?.teamsId[j]) &&
              !(contests[i]?.teamsId[j] == false)
            ) {
              try {
                const ta = teams.find((a) => {
                  if (contests[i]?.teamsId[j] == a._id.toString()) {
                    return true;
                  }
                });

                if (ta) {
                  if (!ta.points) {
                    ta.points = 44;
                  }
                  arr.push(ta);
                }
              } catch (err) {
                console.log(err, "err");
              }
            }
          }

          arr = arr.sort((a, b) => b?.points - a?.points);
          for (let x = 0; x < arr.length; x++) {
            if (arr[x].userId == req.query.userid) {
            }
            try {
              if (contests[i]?.prizeDetails[x]?.prize) {
                totalwon = contests[i]?.prizeDetails[x]?.prize + totalwon;
              }
            } catch (err) {
              console.log(err, "err");
            }
          }
          won = totalwon
        }
        return {
          _id: match._id,
          matchTitle: match.matchTitle,
          format: match.format,
          teams,
          contests,
          won
        };
      })
    );

    res.json({ matches: matchData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// CREATE new user
// --------------------
router.post("/usersz", async (req, res) => {
  try {
    const newUser = new User(req.body)
    const options = {
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
        contact: req.body.phoneNumber,
        type: "employee",
        reference_id: "Domino Contact ID 12345",
        notes: {
          random_key_1: "Make it so.",
          random_key_2: "Tea. Earl Grey. Hot.",
        },
      }),
    };
    let contact_id = "";
    const promise = new Promise((resolve, reject) => {
      request(options, (error, response) => {
        if (error) reject(error);
        const s = JSON.parse(response.body);

        contact_id = s.id;

        newUser.contact_id = contact_id;
        resolve();
      });
    });
    promise
      .then(async () => {
        await newUser.save()
        res.status(201).json({ success: true, user: newUser });
      })
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const newUser = new User(req.body);

    // Hit Razorpay API
    const response = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      {
        name: req.body.username,
        email: req.body.email,
        contact: req.body.phoneNumber,
        type: "employee",
        reference_id: "Domino Contact ID 12345",
        notes: {
          random_key_1: "Make it so.",
          random_key_2: "Tea. Earl Grey. Hot.",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic cnpwX3Rlc3RfT0N0MTBGeGpuWFROV0s6RlpyNW9YQjFCWnFtbDBhUlRhd0IwSUh1",
        },
      }
    );

    // Attach Razorpay contact_id to user
    newUser.contact_id = response.data.id;

    // Save user in MongoDB
    await newUser.save();

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error creating user:", error?.response?.data || error);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

// --------------------
// UPDATE existing user
// --------------------
router.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

// --------------------
// DELETE user
// --------------------
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

router.post("/deposit", async (req, res) => {
  console.log(req.body, "deposit");
  try {
    const deposit = await NewPayment.create({
      recieptUrl: 'https://adminurl.png',
      utr: 'admin',
      amount: req.body.amount,
      userId: req.body.userId,
      verified: true,
      status: "completed"
    });
    await Transaction.create({
      userId: req.body.userId,
      amount: req.body.amount,
      type: "deposit",
      status: "completed",
      action: "deposit",
      transactionId: deposit?._id
    });
    User.findById(req.body.userId).then(async (user) => {
      user.wallet = user.wallet + parseInt(req.body.amount);
      user.totalAmountAdded = user.totalAmountAdded + parseInt(req.body.amount);
      await user.save();
    });
    return res.status(200).json({
      message: "Successfully Saved",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Something Went Wrong",
    });
  }
});

router.post("/withdraw", async (req, res) => {
  console.log(req.body, "withdraw");
  try {
    const user = await User.findById(req.body.userId);
    if (parseInt(user.wallet) > parseInt(req.body.amount)) {
      await Withdraw.create({
        amount: req.body.amount,
        userId: req.body.userId,
        isWithdrawCompleted: true
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


module.exports = router;