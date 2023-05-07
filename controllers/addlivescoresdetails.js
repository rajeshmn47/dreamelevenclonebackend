const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const axios = require("axios");
const getkeys = require("../apikeys");

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

function pointCalculator(runs, fours, sixes, strikeRate, wicket, economy) {
  let totalPoints = runs + fours * 1 + sixes * 2 + 25 * wicket;
  while (runs >= 50) {
    totalPoints += 20;
    runs -= 50;
  }
  if (strikeRate < 100) {
    totalPoints -= 10;
  }
  if (economy >= 12) {
    totalPoints -= 10;
  }
  return totalPoints;
}

module.exports.addLivematchtodb = async function () {
  let date = new Date();
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 1);
  date = new Date(date.getTime() - 24 * 60 * 60 * 1000 * 1);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "mat");
  for (let i = 0; i < matches.length; i++) {
    let matchId = matches[i].matchId;
    let match = await MatchLive.findOne({ matchId: matchId });
    let matid = await Match.findOne({ matchId: matchId });
    if (!match) {
      console.log("matchalreadyexists");
    } else {
      const date1 = matches[i].date;
      const options = {
        method: "GET",
        url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
          "X-RapidAPI-Key": getkeys.getkeys(),
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
      promise
        .then(async (s) => {
          console.log(s, "matchid");
          if (
            s.results.live_details != null &&
            s.results.live_details.teamsheets.home.length != 0
          ) {
            let LiveMatchDet = new MatchLive();
            LiveMatchDet.matchId = matchId;
            LiveMatchDet.date = date1;
            let inPlay = "Yes";
            let status = s.results.live_details.match_summary.status;
            let toss = s.results.live_details.match_summary.toss;
            let result = s.results.live_details.match_summary.result;

            let title_fi = "";
            let overs_fi = 0;
            let runs_fi = 0;
            let wickets_fi = 0;
            let fow_fi = "";
            let extrasDetails_fi = "";
            let batting1 = [];
            let bowling1 = [];
            let title_si = "";
            let overs_si = 0;
            let runs_si = 0;
            let wickets_si = 0;
            let fow_si = "";
            let extrasDetails_si = "";
            let batting2 = [];
            let bowling2 = [];
            if (s.results.live_details.scorecard.length > 0) {
              batting1 = s.results.live_details.scorecard[0].batting;
              bowling1 = s.results.live_details.scorecard[0].bowling;
              title_fi = s.results.live_details.scorecard[0].title;
              overs_fi = s.results.live_details.scorecard[0].overs;
              runs_fi = s.results.live_details.scorecard[0].runs;
              wickets_fi = s.results.live_details.scorecard[0].wickets;
              fow_fi = s.results.live_details.scorecard[0].fow;
              extrasDetails_fi =
                s.results.live_details.scorecard[0].extras_detail;
            }
            if (s.results.live_details.scorecard.length > 1) {
              title_si = s.results.live_details.scorecard[1].title;
              overs_si = s.results.live_details.scorecard[1].overs;
              runs_si = s.results.live_details.scorecard[1].runs;
              wickets_si = s.results.live_details.scorecard[1].wickets;
              fow_si = s.results.live_details.scorecard[1].fow;
              extrasDetails_si =
                s.results.live_details.scorecard[1].extras_detail;
              batting2 = s.results.live_details.scorecard[1].batting;
              bowling2 = s.results.live_details.scorecard[1].bowling;
            }
            let teamHomePlayers = match.teamHomePlayers;
            let teamAwayPlayers = match.teamAwayPlayers;

            let batting = batting1.concat(batting2);
            let bowling = bowling1.concat(bowling2);
            for (let i = 0; i < teamHomePlayers.length; i++) {
              let player = teamHomePlayers[i];
              let playerId = player.playerId;
              for (let batter of batting) {
                if (batter.player_id == playerId) {
                  teamHomePlayers[i].runs = batter.runs;
                  teamHomePlayers[i].balls = batter.balls;
                  teamHomePlayers[i].fours = batter.fours;
                  teamHomePlayers[i].sixes = batter.sixes;
                  teamHomePlayers[i].strikeRate = batter.strike_rate;
                  teamHomePlayers[i].howOut = batter.how_out;
                  teamHomePlayers[i].batOrder = batter.bat_order;
                }
              }
              for (let bowler of bowling) {
                if (bowler.player_id == playerId) {
                  teamHomePlayers[i].overs = bowler.overs;
                  teamHomePlayers[i].maidens = bowler.maidens;
                  teamHomePlayers[i].runsConceded = bowler.runs_conceded;
                  teamHomePlayers[i].wickets = bowler.wickets;
                  teamHomePlayers[i].economy = bowler.economy;
                }
              }
              teamHomePlayers[i].points = pointCalculator(
                teamHomePlayers[i].runs,
                teamHomePlayers[i].fours,
                teamHomePlayers[i].sixes,
                teamHomePlayers[i].sixes,
                teamHomePlayers[i].wickets,
                teamHomePlayers[i].economy
              );
            }
            for (let i = 0; i < teamAwayPlayers.length; i++) {
              let player = teamAwayPlayers[i];
              let playerId = player.playerId;
              for (let batter of batting) {
                if (batter.player_id == playerId) {
                  teamAwayPlayers[i].runs = batter.runs;
                  teamAwayPlayers[i].balls = batter.balls;
                  teamAwayPlayers[i].fours = batter.fours;
                  teamAwayPlayers[i].sixes = batter.sixes;
                  teamAwayPlayers[i].strikeRate = batter.strike_rate;
                  teamAwayPlayers[i].howOut = batter.how_out;
                  teamAwayPlayers[i].batOrder = batter.bat_order;
                }
              }
              for (let bowler of bowling) {
                if (bowler.player_id == playerId) {
                  teamAwayPlayers[i].overs = bowler.overs;
                  teamAwayPlayers[i].maidens = bowler.maidens;
                  teamAwayPlayers[i].runsConceded = bowler.runs_conceded;
                  teamAwayPlayers[i].wickets = bowler.wickets;
                  teamAwayPlayers[i].economy = bowler.economy;
                }
              }
              teamAwayPlayers[i].points = pointCalculator(
                teamAwayPlayers[i].runs,
                teamAwayPlayers[i].fours,
                teamAwayPlayers[i].sixes,
                teamAwayPlayers[i].sixes,
                teamAwayPlayers[i].wickets,
                teamAwayPlayers[i].economy
              );
            }
            try {
              const matchUpdate = await MatchLive.updateOne(
                { matchId: matchId },
                {
                  $set: {
                    inPlay: inPlay,
                    status: status,
                    toss: toss,
                    result: result,
                    teamHomePlayers: teamHomePlayers,
                    teamAwayPlayers: teamAwayPlayers,
                    titleFI: title_fi,
                    oversFI: overs_fi,
                    wicketsFI: wickets_fi,
                    runFI: runs_fi,
                    fowFI: fow_fi,
                    extrasDetailFI: extrasDetails_fi,
                    titleSI: title_si,
                    oversSI: overs_si,
                    wicketsSI: wickets_si,
                    runSI: runs_si,
                    fowSI: fow_si,
                    extrasDetailSI: extrasDetails_si,
                  },
                }
              );
            } catch (err) {
              console.log("Error : " + err);
            }
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
