const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details_new");
const Players = require("../models/players");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");
const Match = require("../models/match");
const User = require("../models/user");

router.get("/home", async (req, res) => {
  let upcomingMatches = {
    results: [],
  };
  let completedMatches = {
    results: [],
  };
  let liveMatches = {
    results: [],
  };
  const matches = await Matches.find();
  const datawe = await LiveMatches.find();
  const players = await Players.find();
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    let match = matches[i];
    let mat = {
      match_title: match.matchTitle,
      home: {
        name: match.teamHomeName,
        code: match.teamHomeCode.toUpperCase(),
      },
      away: {
        name: match.teamAwayName,
        code: match.teamAwayCode.toUpperCase(),
      },
      date: match.date,
      id: match.matchId,
      livestatus: "",
      result: "",
      status: "",
      inPlay: "",
      teamHomeFlagUrl: teamHomeFlagUrl,
      teamAwayFlagUrl: teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    var matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
    console.log(matt, "try");
    if (matt) {
      if (matt.result == "No" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        mat.result = "No";
        liveMatches.results.push(mat);
      } else {
        mat.result = "Yes";
        console.log("lkjh");
        completedMatches.results.push(mat);
      }
    } else {
      console.log(matt, "okvrruto");
      upcomingMatches.results.push(mat);
    }
  }
  res.status(200).json({
    upcoming: upcomingMatches,
    past: completedMatches,
    live: liveMatches,
    new: matches,
    players: players,
  });
});

router.get("/getmatch/:id", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.id });
  res.status(200).json({
    match: match,
  });
});

router.get("/userdata", async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    users: users,
  });
});

module.exports = router;
