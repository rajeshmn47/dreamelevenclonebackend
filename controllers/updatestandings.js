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

  let s = await axios(config).catch(function (error) {
    console.log(error);
  });
  let PlayerS = new Player();

  return s.data.data.length > 0 ? s.data.data[0].image_path : "";
}
module.exports.addTeamstandingstodb = async function () {
  let date = new Date();
  let endDate = date;
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    let matchId = matches[i].matchId;
    const options = {
      method: "GET",
      url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
      headers: {
        "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
        "x-rapidapi-key": "29c032b76emsh6616803b28338c2p19f6c1jsn8c7ad47ac806",
        useQueryString: true,
      },
    };
    let promise = new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        }
        let s = JSON.parse(body);

        resolve(s);
      });
    });
    promise.then(async (s) => {
      const match = await MatchLive.findOne({ matchId: matchId });
      for (let x of s.results.live_details.scorecard[0].batting) {
        for (let i = 0; i < match.teamHomePlayers.length; i++) {
          console.log(match.teamHomePlayers[i].playerId, x);
          if (
            parseInt(match.teamHomePlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
            console.log(x.runs + 1 * x.fours + 2 * x.sixes);
            match.teamHomePlayers[i].points =
              x.runs + 1 * x.fours + 2 * x.sixes;
            match.teamHomePlayers[i].runs = x.runs;
            match.teamHomePlayers[i].balls = x.balls;
            match.teamHomePlayers[i].fours = x.fours;
            match.teamHomePlayers[i].sixes = x.sixes;
            match.teamHomePlayers[i].strikeRate = x.strike_rate;
          }
        }
      }
      for (let x of s.results.live_details.scorecard[0].bowling) {
        for (let i = 0; i < match.teamHomePlayers.length; i++) {
          console.log(match.teamHomePlayers[i].playerId, x);
          if (
            parseInt(match.teamHomePlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
            console.log(x.runs + 1 * x.fours + 2 * x.sixes);
            match.teamAwayPlayers[i].overs = x.overs;
            match.teamAwayPlayers[i].maidens = x.maidens;
            match.teamAwayPlayers[i].runsConceded = x.runs_conceded;
            match.teamAwayPlayers[i].wickets = x.wickets;
            match.teamAwayPlayers[i].economy = x.economy;
            match.teamHomePlayers[i].points =
              x.wickets * 25 + match.teamHomePlayers[i].points;
          }
        }
      }
      const y = await match.save();
    });
  }
};
