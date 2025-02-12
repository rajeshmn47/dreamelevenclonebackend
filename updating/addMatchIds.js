const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

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
