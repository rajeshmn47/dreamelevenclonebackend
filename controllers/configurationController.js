const express = require("express");
const Config = require("../models/config");
const router = express.Router();

// Save or update config by name
router.post("/", async (req, res) => {
  try {
    //await Config.deleteMany({});
    const config = await Config.findOne({});
    //if (!config) {
    //  return res.status(400).json({ success: false, message: "Config not initialized" });
    //}
    if (config) {
      if (req.body.name) config.name = req.body.name;
      if (req.body.tier) config.tier = req.body.tier;

      await config.save();
      res.json({ success: true, config });
    }
    else {
      await Config.create({
        name: req.body.name,
        tier: req.body.tier,
      });
      res.json({ success: true, message: "Config created successfully" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: "Update failed" });
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


