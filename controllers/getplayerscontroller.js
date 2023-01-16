const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");
const MatchLiveDetails = require("../models/match_live_details_new");

router.get("/getplayers/:id", async (req, res) => {
  const players = await MatchLiveDetails.findOne({ matchId: req.params.id });
  const matchdetails = await Matches.findOne({ matchId: req.params.id });
  res.status(200).json({
    players: players,
    matchdetails: matchdetails,
  });
});

module.exports = router;
