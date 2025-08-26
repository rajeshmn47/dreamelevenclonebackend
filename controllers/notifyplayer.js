const express = require("express");
const Clip = require("../models/clips");
const { default: mongoose } = require("mongoose");
const NotifyPlayer = require("../models/notifyPlayer");

const router = express.Router();

// CREATE or UPDATE
router.post("/save-players", async (req, res) => {
  console.log(req.body, 'req body')
  const { user_id, players } = req.body;
  console.log(req.body, 'req body')
  if (!user_id || !Array.isArray(players)) {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  try {
    const existing = await NotifyPlayer.findOne({ user_id });

    if (existing) {
      let fixedPlayers = players.map((player) => { return { player_id: player.id, ...player } })
      existing.players = fixedPlayers;
      await existing.save();
      return res.json({ message: "Updated", data: existing });
    }
    let fixedPlayers = players.map((player) => { return { player_id: player.id, ...player } })
    const newEntry = new NotifyPlayer({ user_id, players: fixedPlayers });
    await newEntry.save();

    res.json({ message: "Created", data: newEntry });
  } catch (err) {
    console.error(err);
res.status(500).json({ error: "Server error" });
  }
});

router.get("/notify-players/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await NotifyPlayer.findOne({ user_id });

    if (!result) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/notify-players/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await NotifyPlayer.findOneAndDelete({ user_id });

    if (!result) {
      return res.status(404).json({ message: "No data found to delete" });
    }

    res.json({ message: "Deleted", data: result });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// PATCH (Edit specific player preference)
router.patch("/notify-players/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { player_id, batting, bowling } = req.body;

  if (!player_id) {
    return res.status(400).json({ error: "player_id required" });
  }

  try {
    const doc = await NotifyPlayer.findOne({ user_id });

    if (!doc) return res.status(404).json({ message: "User not found" });

    const index = doc.players.findIndex(p => p.player_id === player_id);
    if (index === -1) return res.status(404).json({ message: "Player not found in selection" });

    // Update values
    if (typeof batting === "boolean") doc.players[index].batting = batting;
    if (typeof bowling === "boolean") doc.players[index].bowling = bowling;

    await doc.save();
    res.json({ message: "Player updated", data: doc });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

