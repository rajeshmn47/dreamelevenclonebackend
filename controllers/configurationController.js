const express = require("express");
const Config = require("../models/config");
const router = express.Router();

// Save or update config by name
router.post("/", async (req, res) => {
  try {
    const { name, tier } = req.body;
    //await Config.deleteMany({})
    const updated = await Config.findOneAndUpdate(
      { name },
      { tier: tier },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, config: updated });
  } catch (error) {
    console.error("Error saving config:", error);
    res.status(500).json({ success: false, error: "Failed to save config" });
  }
});

// Get all config entries
router.get("/", async (req, res) => {
  try {
    const configs = await Config.find();
    res.status(200).json({ success: true, configs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch configs" });
  }
});

// Get config by name
router.get("/:name", async (req, res) => {
  try {
    const config = await Config.findOne({ name: req.params.name });
    if (!config) {
      return res.status(404).json({ success: false, message: "Config not found" });
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch config" });
  }
});

// Delete config by name
router.delete("/:name", async (req, res) => {
  try {
    const config = await Config.findOneAndDelete({ name: req.params.name });
    if (!config) {
      return res.status(404).json({ success: false, message: "Config not found" });
    }
    res.status(200).json({ success: true, message: "Config deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete config" });
  }
});

module.exports = router;


