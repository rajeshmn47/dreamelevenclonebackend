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

let io = 1;
async function getplayerImage(name) {
  console.log(name);
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
  let date = new Date();
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  date = new Date(date.getTime() - 24 * 60 * 60 * 1000 * 1);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    let matchId = matches[i].matchId;
    let match = await MatchLive.findOne({ matchId: matchId });
    if (match && i < 4) {
      for (let i = 0; i < match.teamAwayPlayers.length; i++) {
        getplayerImage(match.teamAwayPlayers[i].playerName);
        let name = match.teamAwayPlayers[i].playerName.split(" ")[1];
        console.log(name, "name");
        if (i < 11) {
          let options = {
            method: "GET",
            url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        ${process.env.TOKEN}`,
            headers: {
              "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
              "x-rapidapi-key":
                "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
              api_token: process.env.TOKEN,
              useQueryString: true,
            },
            Authorization: {
              api_token: process.env.TOKEN,
            },
          };

          let s = "";
          request(options, async function (error, response, body) {
            s = JSON.parse(body);
            console.log(s.data[0].image_path, s.data[0], "image", i);
            match.teamAwayPlayers[i].image = s?.data[0]?.image_path
              ? s.data[0]?.image_path
              : null;
            await match.save();
          });
        }
      }
      for (let i = 0; i < match.teamHomePlayers.length; i++) {
        getplayerImage(match.teamHomePlayers[i].playerName);
        let name = match.teamHomePlayers[i].playerName.split(" ")[1];
        console.log(name, "name");
        if (i < 11) {
          let options = {
            method: "GET",
            url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        ${process.env.TOKEN}`,
            headers: {
              "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
              "x-rapidapi-key":
                "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
              api_token: process.env.TOKEN,
              useQueryString: true,
            },
            Authorization: {
              api_token: process.env.TOKEN,
            },
          };

          let s = "";
          request(options, async function (error, response, body) {
            s = JSON.parse(body);
            console.log(s.data[0].image_path, s.data[0], "image", i);
            match.teamHomePlayers[i].image = s?.data[0]?.image_path
              ? s.data[0]?.image_path
              : null;
            await match.save();
          });
        }
      }
      console.log(match.teamHomePlayers[i].image, "image");
    } else {
      const date1 = "2679243";
      const options = {
        method: "GET",
        url: `https://cricket-live-data.p.rapidapi.com/match/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
          "X-RapidAPI-Key": `${process.env.API_KEY}`,
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
      });
      promise
        .then(async (s) => {
          console.log(s, "s");
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

              let im = await getplayerImage(x.player_name);
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                image: im,
                position: x.position,
              };
              LiveMatchDet.teamHomePlayers.push(playerDet);
            }

            for (let x of s.results.live_details.teamsheets.away) {
              if (x.position == "Unknown") {
                x.position = "Batsman";
              }

              let im = await getplayerImage(x.player_name);
              let playerDet = {
                playerId: x.player_id,
                playerName: x.player_name,
                points: 4,
                image: im,
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
