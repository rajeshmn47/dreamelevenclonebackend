const Match = require('../models/match');
const request = require('request');
const MatchLive = require('../models/match_live_details');
const { addLivematchtodb } = require('./addlivedetail');

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

let date=new Date()
enddate=date

module.exports.addLivescorestodb = async function(){
    const matches=await MatchLive.find()
    for(let i=0;i<matches.length;i++){
console.log(matches[i].matchId)
const options = {
    method: 'GET',
    url: `https://cricket-live-data.p.rapidapi.com/match/${matches[i].matchId}`,
    headers: {
    'x-rapidapi-host': 'cricket-live-data.p.rapidapi.com',
    'x-rapidapi-key': '773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110',
    useQueryString: true
    }
}
let promise = new Promise((resolve,reject) =>{
    console.log(matches[i].date)
    if((matches[i].date - date)/(60 * 1000) <= 30){
        request(options,function(error,response,body){
            if (error){
                reject(error);
            }
            let s = JSON.parse(body);
            console.log(s,'kuthhe')
            resolve(s);
        })
        
    }else{
        reject('Lineups not out before 30 minutes...');
    }
})
promise.then(async (s)=>{
console.log(s)
let match=new MatchLive()

})
.catch((error)=>{
    console.log(error)
})
}
}