const express = require("express");
const Matches = require("../models/match");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const ContestType = require("../models/contestType");

const router = express.Router();

function findrank(id, arr) {
  const aid = id.toString();
  const y = arr.find((a, index) => index == id);
  return y.rank;
}

router.get("/getcontests/:id", async (req, res) => {
  const contests = await Contest.find({ matchId: req.params.id });
  res.status(200).json({
    contests,
  });
});

router.get("/getallcontests", async (req, res) => {
  const contests = await Contest.find();
  res.status(200).json({
    contests,
  });
});

router.get("/getcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest,
  });
});

router.get("/", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  res.status(200).json({
    contest,
  });
});

router.get("/getcontestsofuser/:id", async (req, res) => {
  const contests = await Contest.find({
    matchId: req.params.id,
    userIds: req.body.uidfromtoken,
  });

  res.status(200).json({
    contests,
  });
});

router.get("/getteamsofcontest/:id", async (req, res) => {
  const contest = await Contest.findOne({ _id: req.params.id });
  const teams = [];
  for (let i = 0; i < contest.teamsId.length; i++) {
    const team = await Team.findById(contest.teamsId[i]);
    teams.push(team);
  }
  const match = await Matches.findOne({ matchId: contest.matchId });
  for (let i = 0; i < teams.length; i++) {
    const user = await User.findById(teams[i].userId);
    const users = { user };
    teams[i] = { ...teams[i], ...users };
  }
  res.status(200).json({
    teams,
    match,
  });
});

router.get("/getjoinedcontest/:id", async (req, res) => {
  try {
    const contests = await Contest.find({
      matchId: req.params.id,
      userIds: req.body.uidfromtoken,
    });
    const teams = [];
    const contestsArray = [];
    for (let i = 0; i < contests?.length; i++) {
      let arr = [];
      for (let j = 0; j < contests[i].teamsId.length; j++) {
        if (contests[i]?.teamsId[j]) {
          if (contests[i]?.teamsId[j]) {
            const team = await Team.findById(contests[i].teamsId[j]);
            if (team) {
              if (!team.points) {
                team.points = 44;
              }
              arr.push(team);
            }
          }
        }
      }
      let teamsarray = [];
      arr = arr.sort((a, b) => b?.points - a?.points);
      for (let x = 0; x < arr.length; x++) {
        const user = await User.findById(arr[x].userId);
        if (arr[x].userId == req.body.uidfromtoken) {
          teamsarray.push({
            ...arr[x]._doc,
            rank: x + 1,
            won: contests[i]?.prizeDetails[x]?.prize
              ? contests[i]?.prizeDetails[x]?.prize
              : 0,
            username: user.username,
            teamnumber: x + 1,
          });
        }
      }
      console.log(teamsarray, "teamsarray");
      contestsArray.push({ contest: contests[i], teams: teamsarray });
    }
    res.status(200).json({
      contests: contestsArray,
    });
  }
  catch (error) {
    console.log(error, 'error')
    res.status(400).json({
      success: false,
      message: "their is an error"
    });
  }
});

module.exports = router;