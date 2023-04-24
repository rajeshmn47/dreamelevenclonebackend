const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");

function findrank(id, arr) {
  let aid = id.toString();
  var y = arr.find((a, index) => index == id);
  console.log(y, "why");
  return y.rank;
}

router.get("/getcontests/:id", async (req, res) => {
  const contests = await Contest.find({ matchId: req.params.id });
  res.status(200).json({
    contests: contests,
  });
});

router.get("/getcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest: contest,
  });
});

router.get("/", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest: contest,
  });
});

router.get("/getcontestsofuser/:id", async (req, res) => {
  const contests = await Contest.find({
    matchId: req.params.id,
    userIds: req.query.userid,
  });

  res.status(200).json({
    contests: contests,
  });
});

router.get("/getteamsofcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  const teams = [];
  for (let i = 0; i < contest.teamsId.length; i++) {
    let team = await Team.findById(contest.teamsId[i]);
    teams.push(team);
  }
  const match = await Matches.findOne({ matchId: contest.matchId });
  for (let i = 0; i < teams.length; i++) {
    const user = await User.findById(teams[i].userId);
    const users = { user: user };
    teams[i] = { ...teams[i], ...users };
  }
  res.status(200).json({
    teams: teams,
    match: match,
  });
});

router.get("/getjoinedcontest/:id", async (req, res) => {
  console.log(req.query, "query");
  const contests = await Contest.find({
    matchId: req.params.id,
    userIds: req.query.userid,
  });
  const teams = [];
  const contestsArray = [];
  const teamsarray = [];
  for (let i = 0; i < contests.length; i++) {
    let arr = [];
    for (let j = 0; j < contests[i].teamsId.length; j++) {
      const team = await Team.findById(contests[i].teamsId[j]);
      if (team) {
        if (!team.points) {
          team.points = 44;
        }
        arr.push(team);
      }
    }

    arr = arr.sort(function (a, b) {
      return b?.points - a?.points;
    });
    for (let x = 0; x < arr.length; x++) {
      console.log(x, "xyz");
      const user = await User.findById(arr[x].userId);
      if (arr[x].userId == req.query.userid) {
        contestsArray.push({
          contests: contests[i],
          team: {
            ...arr[x]._doc,
            rank: x + 1,
            username: user.username,
            teamnumber: x + 1,
          },
        });
      }
    }
  }
  res.status(200).json({
    contests: contestsArray,
  });
});

router.get("/joincontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  const user = await User.findOne({ _id: req.query.userid });
  if (user.wallet > contest.price / contest.totalSpots) {
    user.wallet = user.wallet - contest.price;
    contest.userIds.push(req.query.userid);
    contest.teamsId.push(req.query.teamid);
    contest.spotsLeft = contest.spotsLeft - 1;
    await contest.save();
    await user.save();
    res.status(200).json({
      contest: contest,
    });
  } else {
    res.status(200).json({
      contest: contest,
    });
  }
});

module.exports = router;
