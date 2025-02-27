const express = require("express");
const Matches = require("../models/match");
const LiveMatches = require("../models/matchlive");
const Players = require("../models/players");
const { capitalize } = require("../utils/capitalize")
const router = express.Router();

router.get("/getplayers/:id", async (req, res) => {
  // const matchdetails = await MatchLiveDetails.findOne({ matchId: req.params.id });
  const livedetails = await LiveMatches.findOne({ matchId: req.params.id });
  const matchdetails = await Matches.findOne({ matchId: req.params.id });
  console.log(matchdetails, 'line 12');
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

router.get("/getteam/:homeid/:awayid", async (req, res) => {
  console.log(req.params, "params");
  //const allmatches = await MatchLiveDetails.find();
  const homematch = await LiveMatches.find({
    teamHomeId: req.params.homeid
  },
  ).sort({ date: -1 })
  const homematch1 = await LiveMatches.find({
    teamHomeId: req.params.awayid
  },
  ).sort({ date: -1 })
  const awaymatch = await LiveMatches.find({
    teamAwayId: req.params.awayid
  },
  ).sort({ date: -1 })
  const awaymatch1 = await LiveMatches.find({
    teamAwayId: req.params.homeid
  },
  ).sort({ date: -1 })
  let ho = [];
  let aw = [];
  let x = [];
  let y = [];

  if (homematch[0]?.date > awaymatch1[0]?.date) {
    if (homematch[0]?.teamHomePlayers.length > 0) {
      ho = homematch[0]?.teamHomePlayers;
    }
  } else {
    if (awaymatch1[0]?.teamAwayPlayers.length > 0) {
      aw = awaymatch1[0]?.teamAwayPlayers
    }
  }

  if (awaymatch[0]?.date > homematch1[0]?.date) {
    if (awaymatch[0]?.teamAwayPlayers.length > 0) {
      x = awaymatch[0]?.teamAwayPlayers;
    }
  } else {
    if (homematch1[0]?.teamHomePlayers.length > 0) {
      y = homematch1[0]?.teamHomePlayers;
    }
  }
  let lmplayers = []
  let lmplayersdata = ho?.slice(0, 11).concat(aw?.slice(0, 11)).concat(x?.slice(0, 11)).concat(y?.slice(0, 11))
  if (lmplayersdata?.length > 0) {
    lmplayers = lmplayersdata
  }
  res.status(200).json({
    lmplayers: lmplayers,
    h: ho,
    h1: aw,
    a: x,
    a1: y
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
