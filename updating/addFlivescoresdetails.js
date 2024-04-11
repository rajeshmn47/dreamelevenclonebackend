const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const Contest = require("../models/contest");
const FMatchLive = require("../models/matchlive");
const Player = require("../models/players");
const User = require("../models/user");
const getkeys = require("../crickeys");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function pointCalculator(
  runs,
  fours,
  sixes,
  strikeRate,
  wicket,
  economy,
  balls
) {
  let totalPoints = runs + fours * 1 + sixes * 2 + 25 * wicket;
  while (runs >= 50) {
    totalPoints += 20;
    runs -= 50;
  }
  if (strikeRate < 100 && balls > 10) {
    totalPoints -= 5;
  }
  if (economy >= 12) {
    totalPoints -= 5;
  }
  return totalPoints + 4;
}
module.exports.addLivematchtodb = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime());
  const b = 20 * 60 * 60 * 1000 * 1;
  date = new Date(date.getTime() - b);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    const matchId = matches[i].matchId;
    const match = await FMatchLive.findOne({ matchId: matchId });
    if (!match || match.result == "Complete") {
    } else {
      const keys = await getkeys.getkeys();
      const date1 = matches[i].date;
      const options = {
        method: "GET",
        url: `https://footapi7.p.rapidapi.com/api/match/${matchId}/lineups`,
        headers: {
          "x-rapidapi-host": "footapi7.p.rapidapi.com",
          "X-RapidAPI-Key": "3e774772f1mshd335b4ddbbd2512p194714jsnb9cc15174c3b",
          useQueryString: true,
        },
      };

      const promise = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          }
          const s = JSON.parse(body);
          resolve(s);
        });
      });
      promise
        .then(async (s) => {
          if (s.matchHeader != null && s.scoreCard != 0) {
            const LiveMatchDet = new FMatchLive();
            LiveMatchDet.matchId = matchId;
            LiveMatchDet.date = date1;
            const inPlay = "Yes";
            const { status } = s.matchHeader;
            const toss = s.matchHeader.tossResults.tossWinnerName;
            const result = s.matchHeader.state;
            const { teamHomePlayers } = match;
            const { teamAwayPlayers } = match;
            const batting = [];
            const ke = Object.keys(batting1);
            for (let i = 0; i < ke.length; i++) {
              batting.push(batting1[ke[i]]);
            }
            const kf = Object.keys(batting2);
            for (let i = 0; i < kf.length; i++) {
              batting.push(batting2[kf[i]]);
            }
            const bowling = [];
            const kg = Object.keys(bowling1);
            for (let i = 0; i < kg.length; i++) {
              bowling.push(bowling1[kg[i]]);
            }
            const kh = Object.keys(bowling2);
            for (let i = 0; i < kh.length; i++) {
              bowling.push(bowling2[kh[i]]);
            }
            for (let i = 0; i < teamHomePlayers.length; i++) {
              const player = teamHomePlayers[i];
              const { playerId } = player;
              for (const batter of batting) {
                if (batter.batId == playerId) {
                  teamHomePlayers[i].runs = batter.runs;
                  teamHomePlayers[i].balls = batter.balls;
                  teamHomePlayers[i].fours = batter.boundaries;
                  teamHomePlayers[i].sixes = batter.sixes;
                  teamHomePlayers[i].strikeRate = batter.strikeRate;
                  teamHomePlayers[i].howOut = batter.outDesc;
                  teamHomePlayers[i].batOrder = 0;
                }
              }

              for (const bowler of bowling) {
                const player = teamHomePlayers[i];
                const { playerId } = player;
                if (bowler.bowlerId == playerId) {
                  teamHomePlayers[i].overs = bowler.overs;
                  teamHomePlayers[i].maidens = bowler.maidens;
                  teamHomePlayers[i].runsConceded = bowler.runs;
                  teamHomePlayers[i].wickets = bowler.wickets;
                  teamHomePlayers[i].economy = bowler.economy;
                }
              }
              teamHomePlayers[i].points = pointCalculator(
                teamHomePlayers[i].runs,
                teamHomePlayers[i].fours,
                teamHomePlayers[i].sixes,
                teamHomePlayers[i].strikeRate,
                teamHomePlayers[i].wickets,
                teamHomePlayers[i].economy,
                teamHomePlayers[i].balls
              );
            }
            for (let i = 0; i < teamAwayPlayers.length; i++) {
              const player = teamAwayPlayers[i];
              const { playerId } = player;
              for (const batter of batting) {
                if (batter.batId == playerId) {
                  teamAwayPlayers[i].runs = batter.runs;
                  teamAwayPlayers[i].balls = batter.balls;
                  teamAwayPlayers[i].fours = batter.boundaries;
                  teamAwayPlayers[i].sixes = batter.sixes;
                  teamAwayPlayers[i].strikeRate = batter.strikeRate;
                  teamAwayPlayers[i].howOut = batter.outDesc;
                  teamAwayPlayers[i].batOrder = 0;
                }
              }

              for (const bowler of bowling) {
                const player = teamAwayPlayers[i];
                const { playerId } = player;
                if (bowler.bowlerId == playerId) {
                  teamAwayPlayers[i].overs = bowler.overs;
                  teamAwayPlayers[i].maidens = bowler.maidens;
                  teamAwayPlayers[i].runsConceded = bowler.runs;
                  teamAwayPlayers[i].wickets = bowler.wickets;
                  teamAwayPlayers[i].economy = bowler.economy;
                }
              }
              teamAwayPlayers[i].points = pointCalculator(
                teamAwayPlayers[i].runs,
                teamAwayPlayers[i].fours,
                teamAwayPlayers[i].sixes,
                teamAwayPlayers[i].strikeRate,
                teamAwayPlayers[i].wickets,
                teamAwayPlayers[i].economy,
                teamAwayPlayers[i].balls
              );
            }
            /*
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
                teamHomePlayers[i].strikeRate,
                teamHomePlayers[i].wickets,
                teamHomePlayers[i].economy,
                teamHomePlayers[i].balls
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
                teamAwayPlayers[i].strikeRate,
                teamAwayPlayers[i].wickets,
                teamAwayPlayers[i].economy,
                teamAwayPlayers[i].balls
              );
            }
            */
            try {
              const matchUpdate = await FMatchLive.updateOne(
                { matchId },
                {
                  $set: {
                    inPlay,
                    status,
                    toss,
                    result,
                    teamHomePlayers,
                    teamAwayPlayers,
                    date: matches[i].date,
                    titleFI: title_fi,
                    isHomeFirst: home_first,
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
              console.log(`Error : ${err}`);
            }
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
