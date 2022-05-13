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
    let date=new Date()
    let endDate=date
   const matches=await Match.find({"match_date": {
    $gte: Date(date),
    $lt: Date(endDate)}})
   for(let i=0;i<matches.length;i++){
       let matchId=matches[i].matchId
       let match = await MatchLive.findOne({matchId : matchId});
       if(match){
console.log('matchalreadyexists')

       }
       else{
        const options = {
            method: 'GET',
            url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
            headers: {
            'x-rapidapi-host': 'cricket-live-data.p.rapidapi.com',
            'x-rapidapi-key': '773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110',
            useQueryString: true
            }
        };
        let promise = new Promise((resolve,reject) =>{
            if((matches[i].date - date)/(60 * 1000) <= 30){
                request(options,function(error,response,body){
                    if (error){
                        reject(error);
                    }
                    let s = JSON.parse(body);
                    resolve(s);
                })
                
            }else{
                reject('Lineups not out before 30 minutes...');
            }
        })
        promise.then((s)=>
        console.log(s))
        .catch((error)=>console.log(error))
       }
   }
    
}