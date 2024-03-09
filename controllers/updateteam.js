const request = require("request");
const axios = require("axios");
const Contest = require("../models/contest");
const Team = require("../models/team");
const MatchLive = require("../models/matchlive");
const Player = require("../models/players");

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
  const k = name.split(" ")[0];
  const config = {
    method: "get",
    url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=sachin&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {},
  };

  const s = await axios(config).catch((error) => { });
  const PlayerS = new Player();

  return s.data.data.length > 0 ? s.data.data[0].image_path : "";
}
module.exports.addTeamstandingstodb = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime());
  const b = 1000 * 60 * 60 * 1000 * 1;
  date = new Date(date.getTime() - b);
  const matches = await MatchLive.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    const teams = await Team.find({ matchId: matches[i].matchId });
    for (const x of teams) {
      const team = await Team.findById(x._id);
      team.points = 0;
      for (let j = 0; j < matches[i].teamHomePlayers.length; j++) {
        for (let z = 0; z < team.players.length; z++) {
          if (
            parseInt(matches[i].teamHomePlayers[j].playerId) ==
            parseInt(team.players[z].playerId)
          ) {
            if (parseInt(team.players[z].playerId) == parseInt(team.captainId)) {
              team.players[z].point = parseInt(matches[i].teamHomePlayers[j].points) * 2;
              team.points += parseInt(matches[i].teamHomePlayers[j].points) * 2;
            }
            else if (parseInt(team.players[z].playerId) == parseInt(team.viceCaptainId)) {
              team.players[z].point = parseInt(matches[i].teamHomePlayers[j].points) * 1.5;
              team.points += parseInt(matches[i].teamHomePlayers[j].points) * 1.5;
            }
            else {
              team.players[z].point = matches[i].teamHomePlayers[j].points;
              team.points += matches[i].teamHomePlayers[j].points;
            }
          }
        }
      }
      for (let k = 0; k < matches[i].teamAwayPlayers.length; k++) {
        for (let y = 0; y < team.players.length; y++) {
          if (
            parseInt(matches[i].teamAwayPlayers[k].playerId) ==
            parseInt(team.players[y].playerId)
          ) {
            if (parseInt(team.players[y].playerId) == parseInt(team.viceCaptainId)) {
              team.players[y].point = parseInt(matches[i].teamAwayPlayers[k].points) * 1.5;
              team.points += parseInt(matches[i].teamAwayPlayers[k].points) * 1.5;
            }
            else if (parseInt(team.players[y].playerId) == parseInt(team.captainId)) {
              team.players[y].point = parseInt(matches[i].teamAwayPlayers[k].points) * 2;
              team.points += parseInt(matches[i].teamAwayPlayers[k].points) * 2;
            }
            else {
              team.players[y].point = matches[i].teamAwayPlayers[k].points;
              team.points += matches[i].teamAwayPlayers[k].points;
            }
          }
        }
      }
      const d = await team.save();
    }
  }
};
