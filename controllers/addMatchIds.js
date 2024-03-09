const request = require("request");
const Team = require("../models/team");
const Contest = require("../models/contest");
const User = require("../models/user");
const MatchLiveDetails = require("../models/matchlive");
const getkeys = require("../utils/crickeys");
const Match = require("../models/match");
// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

function getplayerImage(name) {
  const options = {
    method: "GET",
    url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {
      "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
      "x-rapidapi-key": "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
      api_token: "fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv",
      useQueryString: true,
    },
    Authorization: {
      api_token: "fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv",
    },
  };
  let s = "";
  request(options, (error, response, body) => {
    s = JSON.parse(body);
  });
  return s;
}

module.exports.addMatchIds = async function () {
  const matches = await Match.find();
  const users = await User.find();
  for (let x = 0; x < users.length; x++) {
    if(users[x]?._id){
    users[x].matchIds = [];
    for (let i = 0; i < matches.length; i++) {
      const teams = await Team.find({
        $and: [{ matchId: matches[i].matchId }, { userId: users[x]._id }],
      });
      const isTheir = users[x].matchIds.includes(matches[i].matchId);
      if (teams.length > 0 && !isTheir) {
        users[x].matchIds.push(matches[i].matchId);
        console.log(matches[i].matchId, "matchdi");
      }
    }
    await users[x].save();
  }
  }
};
