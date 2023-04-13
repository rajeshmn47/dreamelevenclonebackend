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
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
  let date = new Date();
  let endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
  const matches = await Match.find();
  const axios = require("axios");

  const optionss = {
    method: "GET",
    url: "https://unofficial-cricbuzz.p.rapidapi.com/matches/get-scorecard",
    params: { matchId: "40381" },
    headers: {
      "X-RapidAPI-Key": "3ddef92f6emsh8301b1a8e1fd478p15bb8bjsnd0bb5446cadc",
      "X-RapidAPI-Host": "unofficial-cricbuzz.p.rapidapi.com",
    },
  };
  let promise = new Promise((resolve, reject) => {
    request(optionss, function (error, response, body) {
      if (error) {
        reject(error);
      }
      console.log(body, "software");
      resolve(body);
    });
  });
  promise.then(async (s) => {
    for (let i = 0; i < s.scheduleAdWrapper.length; i++) {
      matches.forEach((e) => console.log(new Date(e.date).getDate(), "rajesh"));
      let ms = matches.filter(
        (m) =>
          new Date(m.date).getDate() ==
            new Date(
              parseInt(
                s.scheduleAdWrapper[i]?.matchScheduleMap?.matchScheduleList[0]
                  ?.matchInfo[0].startDate
              )
            ).getDate() &&
          new Date(m.date).getMonth() ==
            new Date(
              parseInt(
                s.scheduleAdWrapper[i]?.matchScheduleMap?.matchScheduleList[0]
                  ?.matchInfo[0].startDate
              )
            ).getMonth()
      );
      let mt = ms.filter(
        (m) =>
          m.teamHomeCode.toUpperCase() ==
          s.scheduleAdWrapper[i].matchScheduleMap.matchScheduleList[0]
            .matchInfo[0].team1.teamSName
      );
      for (let t = 0; t < mt.length; t++) {
        const matchUpdate = await Match.updateOne(
          { matchId: mt[t].matchId },
          {
            $set: {
              cmtMatchId:
                s.scheduleAdWrapper[i]?.matchScheduleMap?.matchScheduleList[0]
                  ?.matchInfo[0].matchId,
            },
          }
        );
        console.log(matchUpdate, mt, "datopposite");
      }
    }
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
      });
      promise
        .then(async (s) => {
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
