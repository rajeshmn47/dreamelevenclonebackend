const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
const express = require("express");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");

const router = express.Router();

router.post("/saveteam/:id", async (req, res) => {
  const players = [];
  let points = 0;
  for (p in req.body.players) {
    players.push({
      playerId: req.body.players[p].playerId,
      playerName: req.body.players[p].playerName,
      position: req.body.players[p].position,
      point: req.body.players[p].points,
      image: req.body.players[p].image,
    });
    points += req.body.players[p].points;
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
    players,
    points: 44,
  });
  const teams = await Team.find({
    $and: [{ matchId: req.body.matchId }, { userId: req.body.userid }],
  });
  const user = await User.findOne({ _id: req.body.userid });
  user.numberOfTeamsCreated = user.numberOfTeamsCreated + 1;
  console.log(teams.length, teams[0], "team");
  if (!user.matchIds.includes(req.body.matchId)) {
    user.matchIds.push(req.body.matchId);
    await user.save();
  }
  res.status(200).json({
    team,
    message: "team created successfully",
  });
});

router.put("/updateTeam/:id", async (req, res) => {
  const players = [];
  let points = 0;
  for (p in req.body.players) {
    players.push({
      playerId: req.body.players[p].playerId,
      playerName: req.body.players[p].playerName,
      position: req.body.players[p].position,
      point: req.body.players[p].points,
      image: req.body.players[p].image,
    });
    points += req.body.players[p].points;
  }
  const otp = otpGenerator.generate(8, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    specialChars: false,
  });
  const team = await Team.findByIdAndUpdate(req.params.id, {
    matchId: req.body.matchId,
    captainId: req.body.captainId,
    viceCaptainId: req.body.vicecaptainId,
    userId: req.body.userid,
    teamId: otp,
    players: players,
    points: 44,
  });
  console.log(team, req.body);
  res.status(200).json({
    team,
    message: "team updated successfully",
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
    team,
  });
});

router.get("/getallteams", async (req, res) => {
  console.log(req.query, "ok");
  const teams = await Team.find();
  res.status(200).json({
    message: "teams got successfully",
    teams,
  });
});

router.get("/gettodayteams", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const teams = await Team.find({
    createdAt: { $gte: new Date(start), $lt: new Date(end) },
  });
  res.status(200).json({
    message: "teams got successfully",
    teams,
  });
});

router.get("/getteam/:id", async (req, res) => {
  const team = await Team.findById(req.params.id);
  res.status(200).json({
    message: "team got successfully",
    team,
  });
});

module.exports = router;
