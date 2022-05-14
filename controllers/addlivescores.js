const Match = require('../models/match');
const request = require('request');
const MatchLive = require('../models/match_live_details');
const request=require('request')

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

let date=new Date()
enddate=date

module.exports.addLivescorestodb = async function(){
    const matches=await MatchLive.find({"match_date": {
        $gte: Date(date),
        $lt: Date(endDate)}})
    for(let i=0;i<matches.length;i++){
console.log(matches[i])
    }
}