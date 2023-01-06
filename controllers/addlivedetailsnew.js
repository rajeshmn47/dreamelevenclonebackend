const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const axios = require("axios");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

let io=1
async function getplayerImage(name) {
    var k=name.split(' ')[0]
    var config = {
        method: 'get',
        url: `https://cricket.sportmonks.com/api/v2.0/players?filter[lastname]=sachin&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
        headers: { }
      };
      
    let s=await axios(config).catch(function (error) {
        console.log(error);
      });
      let PlayerS = new Player();

  return s.data.data.length>0?s.data.data[0].image_path:'';

}


module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
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
    let match = await MatchLive.findOne({ matchId: matchId });
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
            "29c032b76emsh6616803b28338c2p19f6c1jsn8c7ad47ac806",
          useQueryString: true,
        },
      };
      let promise = new Promise((resolve, reject) => {
     
       
          request(options, function (error, response, body) {
            if (error) {
              reject(error);
            }
            let s = JSON.parse(body);
        
            resolve(s);
          });
      })
      promise
        .then(async (s) => {
            console.log(s)
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
             
            let im=await getplayerImage(x.player_name)
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                image:im,
                position: x.position,
              };
              LiveMatchDet.teamHomePlayers.push(playerDet);
            }
        

            for (let x of s.results.live_details.teamsheets.away) {
              if (x.position == "Unknown") {
                x.position = "Batsman";
              }
            
              let im=await getplayerImage(x.player_name)
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                image:im,
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
