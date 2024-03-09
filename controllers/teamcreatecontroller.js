const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const User = require("../models/user");
const getkeys = require("../utils/crickeys");
const MatchLiveDetails = require("../models/matchlive");
// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

const io = 1;
async function getplayerImage(name) {
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addteamPlayers = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime() + 202 * 60 * 60 * 1000);
  date = new Date(date.getTime());
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    if (!matches[i]?.teamAwayPlayers?.length > 0) {
      let l = [];
      let livematches = await MatchLiveDetails.find({
        teamAwayId: matches[i].teamHomeId,
      });
      l.push(livematches);
      let livematchess = await MatchLiveDetails.find({
        teamHomeId: matches[i].teamHomeId,
      });
      l.push(livematchess);
      let k = l.sort((b, a) => new Date(a.date) - new Date(b.date));
      let xyz = k[0][k[0].length - 1];
      let homeplayers = [];
      if (xyz?.teamHomeId == matches[i].teamHomeId) {
        homeplayers.push(xyz?.teamHomePlayers);
      }
      if (xyz?.teamAwayId == matches[i].teamHomeId) {
        homeplayers.push(xyz?.teamAwayPlayers);
      }
      try {
        const arr = [];
        let position;
        const players = homeplayers[0];
        for (let i = 0; i < players?.length; i++) {
          const check =
            players[i].name == "BATSMEN" ||
            players[i].name == "BOWLER" ||
            players[i].name == "ALL ROUNDER" ||
            players[i].name == "WICKET KEEPER";
          if (check) {
            position = players[i].name;
          } else {
            const a = {
              playerId: players[i].playerId,
              playerName: players[i].playerName,
              image: players[i].image,
              position: players[i].position,
              batOrder: -1,
            };
            arr.push(a);
          }
        }
        matches[i].teamHomePlayers = arr;
      } catch (error) {
        console.error(error);
      }
      try {
        const arr = [];
        let position;
        let l = [];
        let livematches = await MatchLiveDetails.find({
          teamAwayId: matches[i].teamAwayId,
        });
        l.push(livematches);
        let livematchess = await MatchLiveDetails.find({
          teamHomeId: matches[i].teamAwayId,
        });
        l.push(livematchess);
        let k = l.sort((b, a) => new Date(a.date) - new Date(b.date));
        let xyz = k[0][k[0].length - 1];
        let homeplayers = [];
        if (xyz?.teamHomeId == matches[i].teamAwayId) {
          homeplayers.push(xyz?.teamHomePlayers);
        }
        if (xyz?.teamAwayId == matches[i].teamAwayId) {
          homeplayers.push(xyz?.teamAwayPlayers);
        }
        const players = homeplayers;
        for (let i = 0; i < players?.length; i++) {
          const check =
            players[i].name == "BATSMEN" ||
            players[i].name == "BOWLER" ||
            players[i].name == "ALL ROUNDER" ||
            players[i].name == "WICKET KEEPER";
          if (check) {
            position = players[i].name;
          } else {
            const a = {
              playerId: players[i].playerId,
              playerName: players[i].playerName,
              image: players[i].image,
              position: players[i].position,
              batOrder: -1,
            };
            arr.push(a);
          }
        }
        const arr_a = [];
        let position_a;
        const players_a = players[0];
        for (let i = 0; i < players_a?.length; i++) {
          const check =
            players_a[i].name == "BATSMEN" ||
            players_a[i].name == "BOWLER" ||
            players_a[i].name == "ALL ROUNDER" ||
            players_a[i].name == "WICKET KEEPER";
          if (check) {
            position_a = players_a[i].name;
          } else {
            const a = {
              playerId: players_a[i].playerId,
              playerName: players_a[i].playerName,
              image: players_a[i].image,
              position: players_a[i].position,
              batOrder: -1,
            };
            arr_a.push(a);
          }
        }
        matches[i].teamAwayPlayers = arr_a;
      } catch (error) {
        console.error(error);
      }
      try {
        await matches[i].save();
      } catch (error) {
        console.error(error);
      }
    }
  }
};
