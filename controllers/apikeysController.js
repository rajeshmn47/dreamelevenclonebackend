const express = require("express");
const RapidApiKey = require("../models/rapidapikeys");
const User = require("../models/user");

const router = express.Router();

// Create a new API key
router.post("/create", async (req, res) => {
  try {
    const { apiKey, status } = req.body;
    const newApiKey = new RapidApiKey({ apiKey, status });
    await newApiKey.save();
    res.status(201).json({ message: "API key created successfully", newApiKey });
  } catch (error) {
    res.status(400).json({ message: "Error creating API key", error });
  }
});

// Create multiple API keys
router.post("/multiple", async (req, res) => {
  try {
    const { keys } = req.body;
    const apiKeys = keys.map(key => ({ apiKey: key.apiKey, status: "active" }));
    await RapidApiKey.insertMany(apiKeys);
    res.status(201).json({ message: "API keys created successfully", apiKeys });
  } catch (error) {
    res.status(400).json({ message: "Error creating API keys", error });
  }
});

// Get all API keys
router.get("/all", async (req, res) => {
  try {
    console.log(req.body,'uide')
    const apiKeys = await RapidApiKey.find();
    res.status(200).json({ message: "API keys retrieved successfully", apiKeys });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});

router.get("/getTier",async(req,res)=>{ 
    try {
      console.log(req.body,'uidfromtokennnn')
      const apiKeys = await RapidApiKey.find();
      const user = await User.findById(req.body.uidfromtoken);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "API keys retrieved successfully", "usageTier":user.usageTier });
    } catch (error) {
      res.status(400).json({ message: "Error retrieving API keys", error });
    }
  });

// Get a single API key by ID
router.get("/:id", async (req, res) => {
  try {
    const apiKey = await RapidApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({ message: "API key retrieved successfully", apiKey });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API key", error });
  }
});

// Update an API key by ID
router.put("/update/:id", async (req, res) => {
  try {
    const { apiKey, status } = req.body;
    const updatedApiKey = await RapidApiKey.findByIdAndUpdate(
      req.params.id,
      { apiKey, status },
      { new: true }
    );
    if (!updatedApiKey) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({ message: "API key updated successfully", updatedApiKey });
  } catch (error) {
    res.status(400).json({ message: "Error updating API key", error });
  }
});

// Delete an API key by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedApiKey = await RapidApiKey.findByIdAndDelete(req.params.id);
    if (!deletedApiKey) {
      return res.status(404).json({ message: "API key not found" });
    }
    res.status(200).json({ message: "API key deleted successfully", deletedApiKey });
  } catch (error) {
    res.status(400).json({ message: "Error deleting API key", error });
  }
});

// Update usage tier for a user
router.put("/updateUsageTier", async (req, res) => {
  try {
    const { usageTier } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.body.uidfromtoken,
      { usageTier },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Usage tier updated successfully", updatedUser });
  } catch (error) {
    res.status(400).json({ message: "Error updating usage tier", error });
  }
});

// Get usage tier for a user
router.get("/getier", async (req, res) => {
  try {
    console.log(req.body,'uidfromtokens');
    const user = await User.findById(req.body.uidfromtoken);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Usage tier retrieved successfully", usageTier: user.usageTier });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving usage tier", error });
  }
});

module.exports = router;