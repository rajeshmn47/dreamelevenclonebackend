const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");

router.get("/getcontests/:id", async (req, res) => {
  console.log(req.params.id, "id");
  const contests = await Contest.findOne({ matchId: req.params.id });
  res.status(200).json({
    contests: contests,
  });
});

module.exports = router;
