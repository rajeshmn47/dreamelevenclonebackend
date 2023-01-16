const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");

router.post("/saveteam/:id", async (req, res) => {
  let players = [];
  var points = 0;
  for (p in req.body.players) {
    players.push({
      playerId: req.body.players[p].playerId,
      playerName: req.body.players[p].playerName,
      position: req.body.players[p].position,
      point: req.body.players[p].points,
      image: "https://cdn.sportmonks.com/images/cricket/placeholder.png",
    });
    points = points + req.body.players[p].points;
  }
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const team = await Team.create({
    matchId: req.body.matchId,
    captainId: req.body.captainId,
    viceCaptainId: req.body.vicecaptainId,
    userId: req.body.userid,
    teamId: otp,
    players: players,
    points: points,
  });

  res.status(200).json({
    team: team,
    message: "team created successfully",
  });
});

router.get("/getteam", async (req, res) => {
  console.log(req.query, "ok");
  const team = await Team.find({
    matchId: req.query.matchId,
    userId: req.query.userid,
  });
  res.status(200).json({
    message: "team created successfully",
    team: team,
  });
});

router.get("/getteam/:id", async (req, res) => {
  const team = await Team.findById(req.params.id);
  res.status(200).json({
    message: "team got successfully",
    team: team,
  });
});

module.exports = router;
