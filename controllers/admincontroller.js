const express = require("express");
const Matches = require("../models/match");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const ContestType = require("../models/contestType");
const request = require("request");
const axios = require("axios");

const router = express.Router();

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
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
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

module.exports = router;