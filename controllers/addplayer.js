const request = require("request");
const axios = require("axios");
const Match = require("../models/matchtwo");
const User = require("../models/user");

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
  console.log(name);
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addPlayers = async function () {
  let date = new Date();
  const endDate = new Date(date.getMonth() - 3);
  date = new Date(date.getTime());
  const matches = await Match.find();
  for (let i = 0; i < 12; i++) {
    console.log(matches[i].teamHomeId);

    const options = {
      method: "GET",
      url: `https://cricbuzz-cricket.p.rapidapi.com/teams/v1/${matches[i].teamHomeId}/players`,
      headers: {
        "X-RapidAPI-Key": "29c032b76emsh6616803b28338c2p19f6c1jsn8c7ad47ac806",
        "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options);
      const arr = [];
      let position;
      const players = response.data.player;
      for (let i = 0; i < players?.length; i++) {
        console.log("in loop");
        const check =
          players[i].name == "BATSMEN" ||
          players[i].name == "BOWLER" ||
          players[i].name == "ALL ROUNDER" ||
          players[i].name == "WICKET KEEPER";
        if (check) {
          console.log("check");
          position = players[i].name;
        } else {
          console.log("uncheck");
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
      console.log(arr, "players");
      matches[i].teamHomePlayers = arr;
    } catch (error) {
      console.error(error);
    }

    const options_two = {
      method: "GET",
      url: `https://cricbuzz-cricket.p.rapidapi.com/teams/v1/${matches[i].teamAwayId}/players`,
      headers: {
        "X-RapidAPI-Key": "29c032b76emsh6616803b28338c2p19f6c1jsn8c7ad47ac806",
        "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options_two);
      const arr = [];
      let position;
      const players = response.data.player;
      for (let i = 0; i < players?.length; i++) {
        console.log("in loop");
        const check =
          players[i].name == "BATSMEN" ||
          players[i].name == "BOWLER" ||
          players[i].name == "ALL ROUNDER" ||
          players[i].name == "WICKET KEEPER";
        if (check) {
          console.log("check");
          position = players[i].name;
        } else {
          console.log("uncheck");
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
        console.log("in loop");
        const check =
          players_a[i].name == "BATSMEN" ||
          players_a[i].name == "BOWLER" ||
          players_a[i].name == "ALL ROUNDER" ||
          players_a[i].name == "WICKET KEEPER";
        if (check) {
          console.log("check");
          position_a = players_a[i].name;
        } else {
          console.log("uncheck");
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
      console.log(arr, "players");
      matches[i].teamAwayPlayers = arr_a;
    } catch (error) {
      console.error(error);
    }
    await matches[i].save();
  }
};