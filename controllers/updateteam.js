const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const Team = require("../models/team");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const axios = require("axios");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

let io = 1;
async function getplayerImage(name) {
  var k = name.split(" ")[0];
  var config = {
    method: "get",
    url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=sachin&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {},
  };

  let s = await axios(config).catch(function (error) {});
  let PlayerS = new Player();

  return s.data.data.length > 0 ? s.data.data[0].image_path : "";
}
module.exports.addTeamstandingstodb = async function () {
  let date = new Date();
  let endDate = date;
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    const teams = await Team.find({ matchId: matches[i].matchId });
    for (let x of teams) {
      const team = await Team.findOne({ matchId: x.matchId });
      for (let j = 0; j < matches[i].teamHomePlayers.length; j++) {
        for (let z = 0; z < team.players.length; z++) {
          if (
            parseInt(matches[i].teamHomePlayers[j].playerId) ==
            parseInt(team.players[z].playerId)
          ) {
            team.players[z].point = matches[i].teamHomePlayers[j].points;
            team.points = team.points + matches[i].teamHomePlayers[j].points;
          }
        }
      }
      for (let k = 0; k < matches[i].teamAwayPlayers.length; k++) {
        for (let y = 0; y < team.players.length; y++) {
          if (
            parseInt(matches[i].teamAwayPlayers[k].playerId) ==
            parseInt(team.players[y].playerId)
          ) {
            team.players[y].point = matches[i].teamAwayPlayers[k].points;
            team.points = team.points + matches[i].teamAwayPlayers[k].points;
          }
        }
      }
      let d = await team.save();
    }
  }
};
