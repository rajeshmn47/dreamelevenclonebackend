const express = require("express");
const RapidApiKey = require("../models/rapidapikeys");
const User = require("../models/user");
const config = require("../models/config");

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
    //console.log(req.body, 'uide')
    const apiKeys = await RapidApiKey.find();
    res.status(200).json({ message: "API keys retrieved successfully", apiKeys });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});

router.get("/usage", async (req, res) => {
  try {
    //console.log(req.body, 'uidfromtokennnnrr')
    const user = await User.findById(req.body.uidfromtoken);
    const config_file = await config.findOne();
    //console.log(config_file, 'config_file')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    else if (config_file) {
      res.status(200).json({ message: "API keys retrieved successfully", "usageCount": config_file.totalhits });
    }
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});

router.get("/test", async (req, res) => {
  try {
    //console.log(req.body, 'uidfromtokennnnrr')
    const user = await User.findById(req.body.uidfromtoken);
    const config_file = await config.findOne({ name: "default" });
    //console.log(config_file, 'config_file')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    else if (config_file) {
      res.status(200).json({ message: "API keys retrieved successfully", "usageCount": config_file.totalhits });
    }
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});

router.get("/fusage", async (req, res) => {
  try {
    //console.log(req.body, 'uidfromtokennnnrr')
    const user = await User.findById(req.body.uidfromtoken);
    const config_file = await config.findOne({ name: "default" });
    //console.log(config_file, 'config_file')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    else if (config_file) {
      res.status(200).json({ message: "API keys retrieved successfully", "usageCount": config_file.totalhits });
    }
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});

router.put("/updateUsage", async (req, res) => {
  try {
    //console.log(req.body, 'uidfromtokennnn')
    const user = await User.findById(req.body.uidfromtoken);
    id = process.env.refUserId;
    const refConfig = await config.findOne()
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    else if (refConfig) {
      console.log(refConfig, 'ref')
      refConfig.totalhits = parseInt(req.body.usageCount);
      await refConfig.save()
      res.status(200).json({ message: "API keys retrieved successfully", "usageCount": refConfig.totalhits });
    }
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
  }
});


// Get a single API key by ID
router.get("/keys/:id", async (req, res) => {
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

router.get("/get_tier", async (req, res) => {
  try {
    //console.log(req.body, 'uidfromtokennnnrr')
    const user = await User.findById(req.body.uidfromtoken);
    const config_file = await config.findOne({ name: "default" });
    //console.log(config_file, 'config_file')
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    else if (config_file) {
      res.status(200).json({ message: "API keys retrieved successfully", "usageCount": config_file.totalhits });
    }
  } catch (error) {
    res.status(400).json({ message: "Error retrieving API keys", error });
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

module.exports = router;