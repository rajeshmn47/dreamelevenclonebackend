const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const Team = require("../models/team");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const axios = require("axios");
const User = require("../models/user");

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
module.exports.startTransaction = async function () {
  let date = new Date();
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 2);
  date = new Date(date.getTime() - 24 * 60 * 60 * 1000 * 2);
  const matches = await MatchLive.find();
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].result == "Yes") {
      const contests = await Contest.find({ matchId: matches[i].matchId });
      for (let k = 0; k < contests.length; k++) {
        let teams = [];
        for (let j = 0; j < contests[k].teamsId.length; j++) {
          let team = await Team.findById(contests[k].teamsId[j]);
          teams.push(team);
        }
        function compare(a, b) {
          if (a.points < b.points) {
            return -1;
          }
          if (a.points > b.points) {
            return 1;
          }
          return 0;
        }
        teams = teams.sort(compare);
        for (let j = 0; j < contests[k].prizeDetails.length; j++) {
          if (teams.length > 0 && teams[j]?.userId) {
            const user = await User.findById(teams[j].userId);
            console.log(user, "user");
            user.wallet = user.wallet + contests[k].prizeDetails[j].prize;
            await user.save();
          }
        }
      }
    }
  }
};
