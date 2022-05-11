const Match = require('../models/match');
const request = require('request');
const Contest = require('../models/contest');

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b){
    return a.date < b.date;
}

module.exports.addMatchtoDb = async function(){
    function pad2(n) { 
        return (n < 10 ? '0' : '') + n;
    }
      
    let obj = {
        "results" : []
    };
    var date = new Date();
    var month = pad2(date.getMonth()+1);//months (0-11)
    var day = pad2(date.getDate());//day (1-31)
    var year= date.getFullYear();
    // var year = "2021";
    // var month = "09";
    // var day = 25;
    var formattedDate =  year+"-"+month+"-"+day;
    const numberOfDays = 4;

    for (let i = 0; i < numberOfDays; i++){
        console.log(formattedDate);
        const options = {
            method: 'GET',
            url: `https://cricket-live-data.p.rapidapi.com/fixtures-by-date/${formattedDate}`,
            headers: {
            'x-rapidapi-host': 'cricket-live-data.p.rapidapi.com',
            'x-rapidapi-key': '773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110',
            useQueryString: true 
            }  
        };
        // Doubt in this part, is request is synchronous or non synchronous?
        let promise = new Promise((resolve,reject) =>{
            request(options,function(error,response,body){
                if (error){
                    reject(error); 
                }
                // console.log(body)
                let s = JSON.parse(body);
                // console.log(s);
                resolve(s);
            })
        });
        promise.then( async (s)=>{
            console.log(s);
            for(mat of s.results){
                obj.results.push(mat);
            }

            if(i == numberOfDays-1){
                obj.results.sort(compare);
                for(let i=0;i<obj.results.length;i++){
                    let match1 = new Match();
                    const matchId = obj.results[i].id;
                    // console.log(obj.results[i]);
                    match1.matchId = matchId;
                    match1.matchTitle = obj.results[i].match_title;
                    match1.teamHomeName = obj.results[i].home.name;
                    match1.teamAwayName = obj.results[i].away.name;
                    match1.date = obj.results[i].date;
                    if(obj.results[i].home.code == ""){
                        continue;
                    }else{
                        match1.teamHomeCode = obj.results[i].home.code;
                    }
                    if(obj.results[i].away.code == ""){ 
                        continue;
                    }else{
                        match1.teamAwayCode = obj.results[i].away.code;
                    }
                    try{
                        let match = await Match.findOne({matchId : matchId});
                        if(!match){
                            let prize = [
                                50000, 40000, 30000, 10000
                            ];
                            // let prizeBreakup = [
                            //     5, 4, 3, 1
                            // ];
                            let totalspots = [50, 40, 30, 10];
                            for (let j = 0; j < 4; j++){
                                let contest1 = new Contest();
                                contest1.price = prize[j];
                                contest1.totalSpots = totalspots[j];
                                contest1.spotsLeft = totalspots[j];
                                contest1.matchId = matchId;
                                let prizeDetails = [
                                    {
                                        prize : prize[j] * 0.35
                                    },
                                    {
                                        prize : prize[j] * 0.25
                                    },
                                    {
                                        prize : prize[j] * 0.15
                                    },
                                    {
                                        prize : prize[j] * 0.10
                                    },
                                    {
                                        prize : prize[j] * 0.05
                                    },
                                ]
                                contest1.prizeDetails = prizeDetails;
                                contest1.numWinners = 5;
                                console.log(contest1.price +" "+contest1.totalSpots + contest1.spotsLeft +contest1.matchId);
                                try{
                                    let contest2 = await Contest.create(contest1);
                                    console.log(obj.results[i].match_subtitle);
                                    if(contest2){
                                        match1.contestId.push(contest2.id);
                                        console.log('Succesfully created the contest');
                                    }
                                }catch(err){
                                    console.log("Error : " + err);
                                }
                            }
                            try{
                                let match = await Match.create(match1);
                                if(match){
                                    console.log('match is successfully added in db! ');
                                }
                            }catch(err){
                                console.log("Error : " + err);
                            }
    
                        }else{
                            console.log('Match already exist in database! ');
                        }
                    }catch(err){
                        console.log("Error : " + err);
                    }
                }
            }
        } ).catch((err)=>{
            console.log("Error : " + err);
        })
        date = new Date(date.getTime() + (24 * 60 * 60 * 1000));
        var month = pad2(date.getMonth()+1);//months (0-11)
        var day = pad2(date.getDate());//day (1-31)
        var year= date.getFullYear();
        // day++;
        formattedDate =  year+"-"+month+"-"+day;
    }
}