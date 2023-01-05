const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details");
const Player = require("../models/players");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}
async function getplayerImage(name) {
  const options = {
    method: "GET",
    url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {
      "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
      "x-rapidapi-key": "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
      useQueryString: true,
    },
    authorization: {
      api_token: "fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv",
    },
  };
  let s = "";
  request(options, async function (error, response, body) {
    s = JSON.parse(body);
    console.log(s, "s");
    let PlayerS = new Player();
    (PlayerS.name = s.data[0].firstname),
      (PlayerS.firstname = s.data[0].firstname),
      (PlayerS.astname = s.data[0].lastname),
      (PlayerS.image = s.data[0].image_path),
      (PlayerS.dateofbirth = s.data[0].dateofbirth),
      (PlayerS.id = s.data[0].id),
      (PlayerS.country_id = s.data[0].country_id),
      (s = await Player.create(PlayerS));
  });
  return s.image;
}
module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
  console.log(turing, "corona");
  let date = new Date();
  let endDate = date;
  const matches = await Match.find({
    match_date: {
      $gte: Date(date),
      $lt: Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    let matchId = matches[i].matchId;
    console.log(matchId, "getid");
    let match = await MatchLive.findOne({ matchId: matchId });
    console.log(match, "gestid");
    if (match) {
      console.log("matchalreadyexists");
    } else {
      const date1 = matches[i].date;
      const options = {
        method: "GET",
        url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
          "x-rapidapi-key":
            "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
          useQueryString: true,
        },
      };
      let promise = new Promise((resolve, reject) => {
        console.log(matches[i].date);
        if ((matches[i].date - date) / (60 * 1000) <= 30) {
          request(options, function (error, response, body) {
            if (error) {
              reject(error);
            }
            let s = JSON.parse(body);
            console.log(s, "kuthhe");
            resolve(s);
          });
        } else {
          reject("Lineups not out before 30 minutes...");
        }
      });
      promise
        .then(async (s) => {
          if (
            s.results.live_details != null &&
            s.results.live_details.teamsheets.home.length != 0
          ) {
            let LiveMatchDet = new MatchLive();
            LiveMatchDet.matchId = matchId;
            LiveMatchDet.date = date1;

            for (let x of s.results.live_details.teamsheets.home) {
              if (x.position == "Unknown") {
                x.position = "Batsman";
              }
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                position: x.position,
              };
              LiveMatchDet.teamHomePlayers.push(playerDet);
            }

            for (let x of s.results.live_details.teamsheets.away) {
              if (x.position == "Unknown") {
                x.position = "Batsman";
              }
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                position: x.position,
              };
              LiveMatchDet.teamAwayPlayers.push(playerDet);
            }

            let match = await MatchLive.create(LiveMatchDet);
            if (match) {
              console.log(
                "Live Details of match is successfully added in db! "
              );
            }
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
