const express = require("express");
const Config = require("../models/config");
const { cronjobs } = require("../updating/cronJobs");
const RapidApiKey = require("../models/rapidapikeys");
const router = express.Router();

// Get the single config
router.get("/", async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      // Create default config if none exists
      config = await Config.create({ name: "default" });
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch config" });
  }
});

// Update the single config
router.put("/", async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      // Create if not exists
      config = await Config.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update config" });
  }
});

router.post("/updateFrequencies", async (req, res) => {
  try {
    const { frequencies } = req.body;
    if (!frequencies || typeof frequencies !== "object") {
      return res.status(400).json({ success: false, error: "Invalid frequencies data" });
    }

    // Find the single config
    let config = await Config.findOne();
    if (!config) {
      // If no config exists, create default and set frequencies
      config = await Config.create({ name: "default", frequencies });
    } else {
      // Update only frequencies
      config.frequencies = frequencies;
      await config.save();
      cronjobs()
    }

    res.status(200).json({ success: true, message: "Frequencies updated", config });
  } catch (error) {
    console.error("Error updating frequencies:", error);
    res.status(500).json({ success: false, error: "Failed to update frequencies" });
  }
});

router.post("/key/update", async (req, res) => {
  try {
    const key = req.body;
    const updated = await RapidApiKey.updateOne({ _id: key._id }, { $set: { status: key.status } }, { new: true, upsert: true });
    if (!updated) {
      return res.status(404).json({ message: "not updated" });
    }

    if (updated) {
      res.status(200).json({ message: "API key updated successfully", updated });
    }
    else {
      res.status(400).json({ message: "Error updating API key", error });
    }
  } catch (error) {
    res.status(400).json({ message: "Error updating API key", error });
  }
});


module.exports = router;


