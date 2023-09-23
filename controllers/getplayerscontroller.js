const flagURLs = require("country-flags-svg");
const express = require("express");
const Matches = require("../models/match");
const LiveMatches = require("../models/matchlive");
const Players = require("../models/players");
const Contest = require("../models/contest");

const router = express.Router();

router.get("/getplayers/:id", async (req, res) => {
  // const matchdetails = await MatchLiveDetails.findOne({ matchId: req.params.id });
  const livedetails = await LiveMatches.findOne({ matchId: req.params.id });
  const matchdetails = await Matches.findOne({ matchId: req.params.id });
  console.log(matchdetails);
  if (livedetails) {
    let data = {};
    livedetails.teamHomePlayers = livedetails.teamHomePlayers;
    data = {
      ...livedetails._doc,
      teamHomeCode: matchdetails.teamHomeCode,
      teamAwayCode: matchdetails.teamAwayCode,
    };
    matchdetails.teamAwayPlayers = livedetails.teamAwayPlayers;
    res.status(200).json({
      players: livedetails,
      matchdetails: data,
      live: true,
    });
  } else if (matchdetails) {
    res.status(200).json({
      players: matchdetails,
      matchdetails,
      live: false,
    });
  }
});

router.get("/getplayersom/:id", async (req, res) => {
  // const matchdetails = await MatchLiveDetails.findOne({ matchId: req.params.id });
  const matchdetails = await Matches.findOne({ matchId: req.params.id });
  res.status(200).json({
    players: matchdetails,
    matchdetails,
    live: false,
  });
});

router.get("/getteam/:homename/:awayname", async (req, res) => {
  console.log(req.params, "params");
  const allmatches = await LiveMatches.find();
  const homematch = await LiveMatches.find({
    titleFI: { $regex: req.params.homename },
  });
  const awaymatch = await LiveMatches.find({
    titleSI: { $regex: req.params.awayname },
  });
  const homematch1 = await LiveMatches.find({
    titleFI: { $regex: req.params.awayname },
  });
  const awaymatch1 = await LiveMatches.find({
    titleSI: { $regex: req.params.homename },
  });
  let awaymatches = awaymatch?.concat(awaymatch1);
  let homematches = homematch?.concat(homematch1);
  let AWAY = awaymatches.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  let HOME = homematches.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  homegame = await LiveMatches.find({ titleSI: "Somerset" });
  let homelast;
  let awaylast;
  if (HOME.length > 0) {
    homelast = HOME[HOME.length - 1];
  }
  if (AWAY.length > 0) {
    awaylast = AWAY[AWAY.length - 1];
  }
  let lmplayers = homelast?.teamHomePlayers
    .splice(0, 11)
    .concat(awaylast?.teamAwayPlayers.splice(0, 11));
  res.status(200).json({
    lmplayers: lmplayers,
    allmatches,
  });
});

router.get("/getplayers", async (req, res) => {
  console.log("getplayers");
  const players = await Players.find();
  res.status(200).json({
    players,
  });
});

module.exports = router;
