const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const User = require("../models/user");
const getkeys = require("../utils/crickeys");
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

module.exports.addPlayers = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime() + 202 * 60 * 60 * 1000);
  let keys = await getkeys.getkeys();
  date = new Date(date.getTime());
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  console.log(matches?.length, 'found matches')
  for (let i = 0; i < 1; i++) {
    if (!matches[i]?.teamAwayPlayers?.length > 0) {
      console.log(matches[i]?.teamAwayPlayers.length, 'found matches')
      const options = {
        method: "GET",
        url: `https://cricbuzz-cricket.p.rapidapi.com/teams/v1/${matches[i].teamHomeId}/players`,
        headers: {
          "X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
          "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
        },
      };

      try {
        const response = await axios.request(options);
        const arr = [];
        let position;
        const players = response.data.player;
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
              playerId: players[i].id,
              playerName: players[i].name,
              image: players[i].imageId,
              position,
              batOrder: -1,
            };
            arr.push(a);
          }
        }
        matches[i].teamHomePlayers = arr;
      } catch (error) {
        console.error(error);
      }
      const options_two = {
        method: "GET",
        url: `https://cricbuzz-cricket.p.rapidapi.com/teams/v1/${matches[i].teamAwayId}/players`,
        headers: {
          "X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
          "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
        },
      };

      try {
        const response = await axios.request(options_two);
        const arr = [];
        let position;
        const players = response.data.player;
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
              playerId: players[i].id,
              playerName: players[i].name,
              image: players[i].imageId,
              position,
              batOrder: -1,
            };
            arr.push(a);
          }
        }
        const arr_a = [];
        let position_a;
        const players_a = response.data.player;
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
              playerId: players_a[i].id,
              playerName: players_a[i].name,
              image: players_a[i].imageId,
              position: position_a,
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
        console.log(matches[i],'matchteamer')
        let m = await matches[i].save();
        console.log(m,'matchteam')
      } catch (error) {
        console.error(error);
      }
    }
  }
};
