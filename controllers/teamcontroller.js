const flagURLs = require("country-flags-svg");
const otpGenerator = require("otp-generator");
const express = require("express");
const Players = require("../models/players");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");

const router = express.Router();

router.post("/saveteam/:id", async (req, res) => {
  console.log(req.body, 'body');
  const match = await Match.findOne({ matchId: req.body.matchId });
  const date = new Date();
  const players = [];
  if (date < match?.date) {
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
    const userteams = await Team.find({ $and: [{ matchId: req.body.matchId }, { userId: req.body.uidfromtoken }] });
    const team = await Team.create({
      matchId: req.body.matchId,
      captainId: req.body.captainId,
      viceCaptainId: req.body.vicecaptainId,
      userId: req.body.uidfromtoken,
      teamId: userteams?.length + 1,
      players,
      points: 44,
    });
    const teams = await Team.find({
      $and: [{ matchId: req.body.matchId }, { userId: req.body.uidfromtoken }],
    });
    const user = await User.findOne({ _id: req.body.uidfromtoken });
    user.numberOfTeamsCreated = user.numberOfTeamsCreated + 1;
    if (!user.matchIds.includes(req.body.matchId)) {
      user.matchIds.push(req.body.matchId);
      await user.save();
    }
    res.status(200).json({
      team,
      message: "team created successfully",
    });
  }
  else {
    res.status(400).json({
      messae: "failure",
      message: "cannot create team after match beagan",
    });
  }
});

router.put("/updateTeam/:id", async (req, res) => {
  const players = [];
  let points = 0;
  const match = await Match.findOne({ matchId: req.body.matchId });
  const date = new Date();
  if (date < match?.date) {
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
    const team = await Team.findByIdAndUpdate(req.params.id, {
      matchId: req.body.matchId,
      captainId: req.body.captainId,
      viceCaptainId: req.body.vicecaptainId,
      userId: req.body.uidfromtoken,
      players: players,
      points: 44
    });
    res.status(200).json({
      team,
      message: "team updated successfully",
    });
  }
  else {
    res.status(400).json({
      success: false,
      message: "time is up",
    });
  }
});

router.get("/getteam", async (req, res) => {
  const team = await Team.find({
    matchId: req.query.matchId,
    userId: req.body.uidfromtoken
  });
  res.status(200).json({
    message: "team created successfully",
    team,
  });
});

router.get("/getallteams", async (req, res) => {
  const teams = await Team.aggregate(
    [
      { "$project": { "userId": { "$toObjectId": "$userId" } } },
      {
        $lookup: {
          from: "users",//your schema name from mongoDB
          localField: "userId", //user_id from user(main) model
          foreignField: "_id",//user_id from user(sub) model
          as: "user"//result var name
        }
      },
      {
        $lookup: {
          from: "teams",//your schema name from mongoDB
          localField: "_id", //user_id from user(main) model
          foreignField: "_id",//user_id from user(sub) model
          as: "team"//result var name
        }
      }
    ]
  )
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

router.get("/getTeamsofMatch/:id", async (req, res) => {
  const teams = await Team.find({ matchId: req.params.id });
  res.status(200).json({
    message: "teams got successfully",
    teams: teams
  });
});

module.exports = router;
