const Match = require('../models/match');
const request = require('request');
const Contest = require('../models/contest');
const MatchLive = require('../models/match_live_details');

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b){
    return a.date < b.date;
}

module.exports.addLivematchtodb = async function(){
   const matches=await Match.find({"match_date": {
    $gte: Date(date),
    $lt: Date(endDate)}})
   for(let i=0;i<matches.length;i++){
       let matchdata=matches[i]
       let mat = await MatchLive.findOne({matchId : matchdata.matchId});
       if(mat){
console.log('matchalreadyexists')
       }
       else{
           var livematch=new MatchLive()
       }
   }
    
}