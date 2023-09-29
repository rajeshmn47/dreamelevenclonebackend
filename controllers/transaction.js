const request = require("request");
const axios = require("axios");
const mongoose = require("mongoose");
const Match = require("../models/match");
const Contest = require("../models/contest");
const Team = require("../models/team");
const MatchLive = require("../models/matchlive");
const Player = require("../models/players");
const User = require("../models/user");
const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

const io = 1;
async function getplayerImage(name) {
  const k = name.split(" ")[0];
  const config = {
    method: "get",
    url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=sachin&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {},
  };

  const s = await axios(config).catch((error) => {});
  const PlayerS = new Player();

  return s.data.data.length > 0 ? s.data.data[0].image_path : "";
}
module.exports.startTransaction = async function () {
  let date = new Date();
  console.log(date, "date");
  const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 2);
  date = new Date(date.getTime() - 24 * 60 * 60 * 1000 * 2);
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].result == "Complete" && !matches[i].transaction) {
      const contests = await Contest.find({ matchId: matches[i].matchId });
      for (let k = 0; k < contests.length; k++) {
        let teams = [];
        contests[k].teamsId = contests[k].teamsId.filter((t) => t);
        if (contests[k]?.teamsId?.length) {
          for (let j = 0; j < contests[k].teamsId.length; j++) {
            if (mongoose.Types.ObjectId.isValid(contests[k].teamsId[j])) {
              const team = await Team.findById(contests[k].teamsId[j]);
              teams.push(team);
            }
          }
          function compare(a, b) {
            if (a.points < b.points) {
              return -1;
            }
            if (a.points > b.points) {
              return 1;
            }
            return 0;
          }
        }
        teams = teams.sort(compare);
        for (let j = 0; j < contests[k].prizeDetails.length; j++) {
          if (teams.length > 0 && teams[j]?.userId) {
            const user = await User.findById(teams[j].userId);
            //console.log(user, "user");
            user.wallet += contests[k].prizeDetails[j].prize;
            user.totalAmountWon += contests[k].prizeDetails[j].prize;
            try {
              await user.save();
              //matches[i].transaction = true;
              //await matches.save();
              const matchUpdate = await MatchLive.updateOne(
                { matchId: matches[i]?.matchid },
                {
                  $set: {
                    transaction: true,
                  },
                }
              );
            } catch (e) {
              console.log(error);
            }
          }
        }
      }
    }
  }
};
