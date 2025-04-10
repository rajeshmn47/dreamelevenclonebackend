const mongoose = require("mongoose");
const Contest = require("../models/contest");
const Team = require("../models/team");
const MatchLive = require("../models/matchlive");
const User = require("../models/user");
const express = require("express");
const { messaging } = require("../utils/firebaseinitialize");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }
module.exports.startCryptoTransaction = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 2);
  date = new Date(date.getTime() - 24 * 60 * 60 * 1000 * 2);
  const matches = await MatchLive.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].result == "Complete" && !matches[i].cryptoTransaction) {
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
            user.cryptoWallet += contests[k].prizeDetails[j].prize / 10000;
            user.totalAmountWon += contests[k].prizeDetails[j].prize;
            try {
              await user.save();
              //matches[i].transaction = true;
              //await matches.save();
              if (user?.fcmtoken) {
                const message = {
                  notification: {
                    title: "Congratulations!",
                    body: `You won DBC${contests?.[k]?.prizeDetails?.[j]?.prize/10000}! Check your wallet for details.`,
                  },
                  token: user.fcmtoken,
                };
                await messaging.send(message)
              }
              const matchUpdate = await MatchLive.updateOne(
                { matchId: matches[i]?.matchId },
                {
                  $set: {
                    cryptoTransaction: true,
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
