const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details_new");
const Players = require("../models/players");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");
const Match = require("../models/match");
const Team = require("../models/team");
const User = require("../models/user");
const Contest = require("../models/contest");
const MatchLiveDetails = require("../models/match_live_details_new");

router.get("/home/:userid", async (req, res) => {
  let stime = new Date().getSeconds();
  console.log(req.params.userid, "userid");
  let upcomingMatches = {
    results: [],
  };
  let completedMatches = {
    results: [],
  };
  let liveMatches = {
    results: [],
  };
  let date = new Date();
  date.setDate(date.getDate() - 1);
  let startDate = date.toISOString();
  date.setDate(date.getDate() + 6);
  let endDate = date.toISOString();
  let matches = await Matches.find({
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "mathes");
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
      lineups: "",
      teamHomeFlagUrl: teamHomeFlagUrl,
      teamAwayFlagUrl: teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    var matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
    let contests = [];
    let teams = [];
    if (matt) {
      if (matt.result == "No" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        if((!(matt.inPlay=="Yes"))&&(matt?.teamHomePlayers?.length > 0)){
          upcomingMatches.results.push(mat)
          mat.lineups = "LineUps are out";
        }
        else{
        mat.result = "No";
        mat.lineups = "LineUps are out";
        if (req.params.userid) {
          contests = await Contest.find({
            userIds: req.params.userid,
            matchId: matches[i].matchId,
          });
          teams = await Team.find({
            $and: [
              { matchId: matches[i].matchId },
              { userId: req.params.userid },
            ],
          });
        }
        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          liveMatches.results.push(mat);
        }
        }
      } else {
        mat.result = "Yes";
        if (matt && completedMatches.results.length < 1) {
          if (req.params.userid) {
            contests = await Contest.find({
              userIds: req.params.userid,
              matchId: matches[i].matchId,
            });
            teams = await Team.find({
              $and: [
                { matchId: matches[i].matchId },
                { userId: req.params.userid },
              ],
            });
          }
        }
        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          completedMatches.results.push(mat);
        }
      }
    } else {
      if (matt?.teamHomePlayers?.length > 0) {
        mat.lineups = "LineUps are out";
      }
      upcomingMatches.results.push(mat);
    }
  }
  const etime = new Date().getSeconds();
  console.log(etime - stime, "totlal time");
  res.status(200).json({
    upcoming: upcomingMatches,
    past: completedMatches,
    live: liveMatches,
    new: matches,
  });
});

router.get("/completed/:userid", async (req, res) => {
  res.status(200).json({
    upcoming: upcomingMatches,
    past: completedMatches,
    live: liveMatches,
    new: matches,
  });
});

router.get("/getmatch/:id", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.id });
  res.status(200).json({
    match: match,
  });
});

router.get("/getmatchlive/:id", async (req, res) => {
  const match = await MatchLiveDetails.findOne({ matchId: req.params.id });
  console.log("masthhudgi", match);
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
