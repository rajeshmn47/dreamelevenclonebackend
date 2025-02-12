const request = require("request");
const MatchLive = require("../models/matchlive");
const {getkeys} = require("../utils/crickeys");



module.exports.addTeamstandingstodbAPI = async function () {
  try{
  const date = new Date();
  const endDate = date;
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    const { matchId } = matches[i];
    const keys = await getkeys();
    const options = {
      method: "GET",
      url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
      headers: {
        "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
        "x-rapidapi-key": keys,
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
    promise.then(async (s) => {
      const match = await MatchLive.findOne({ matchId });
      const batting = s?.results?.live_details?.scorecard?.[0]?.batting || [];
      for (const x of batting) {
        for (let i = 0; i < match.teamHomePlayers.length; i++) {
          if (
            parseInt(match.teamHomePlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
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
      const batting2 = s?.results?.live_details?.scorecard?.[1]?.batting || [];
      for (const x of batting2) {
        for (let i = 0; i < match.teamAwayPlayers.length; i++) {
          if (
            parseInt(match.teamAwayPlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
            match.teamHomePlayers[i].points =
              x.runs + 1 * x.fours + 2 * x.sixes;
            match.teamAwayPlayers[i].runs = x.runs;
            match.teamAwayPlayers[i].balls = x.balls;
            match.teamAwayPlayers[i].fours = x.fours;
            match.teamAwayPlayers[i].sixes = x.sixes;
            match.teamAwayPlayers[i].strikeRate = x.strike_rate;
          }
        }
      }
      for (const x of s.results.live_details.scorecard[0].bowling) {
        for (let i = 0; i < match.teamHomePlayers.length; i++) {
          if (
            parseInt(match.teamHomePlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
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
      for (const x of s.results.live_details.scorecard[1].bowling) {
        for (let i = 0; i < match.teamHomePlayers.length; i++) {
          if (
            parseInt(match.teamHomePlayers[i].playerId) ===
            parseInt(x.player_id)
          ) {
            match.teamHomePlayers[i].overs = x.overs;
            match.teamHomePlayers[i].maidens = x.maidens;
            match.teamHomePlayers[i].runsConceded = x.runs_conceded;
            match.teamHomePlayers[i].wickets = x.wickets;
            match.teamHomePlayers[i].economy = x.economy;
            match.teamHomePlayers[i].points =
              x.wickets * 25 + match.teamHomePlayers[i].points;
          }
        }
      }
      const y = await match.save();
    });
  }
}
catch(error){
  console.log(error)
}
};
