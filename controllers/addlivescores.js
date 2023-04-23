const Match = require("../models/match");
const request = require("request");
const MatchLive = require("../models/match_live_details");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

let date = new Date();
enddate = date;

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
  request(options, function (error, response, body) {
    s = JSON.parse(body);
  });
  return s;
}
module.exports.addLivescorestodb = async function () {
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    const options = {
      method: "GET",
      url: `https://cricket-live-data.p.rapidapi.com/match/${matches[i].matchId}`,
      headers: {
        "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
        "x-rapidapi-key": "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
        useQueryString: true,
      },
    };
    let promise = new Promise((resolve, reject) => {
      if ((matches[i].date - date) / (60 * 1000) <= 30) {
        request(options, function (error, response, body) {
          if (error) {
            reject(error);
          }
          let s = JSON.parse(body);

          resolve(s);
        });
      } else {
        reject("Lineups not out before 30 minutes...");
      }
    });
    promise
      .then(async (s) => {
        let match = new MatchLive();
      })
      .catch((error) => {
        console.log(error);
      });
  }
};
