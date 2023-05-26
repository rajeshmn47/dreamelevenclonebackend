const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const User = require("../models/user");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

const io = 1;
async function getplayerImage(name) {
  console.log(name);
  return "https://cdn.sportmonks.com/images/cricket/placeholder.png";
}

module.exports.addPlayers = async function () {
  const turing = await MatchLive();
  let date = new Date();
  const endDate = new Date(date.getMonth() - 3);
  date = new Date(date.getTime());
  const matches = await Match.find();
  const user = await User.findById("63c18c9f2d217ea120307e30");
  for (let i = 0; i < user.matchIds.length; i++) {
    const match = await MatchLive.findOne({ matchId: user.matchIds[i] });
    if (match) {
      for (let i = 0; i < match.teamAwayPlayers.length; i++) {
        const name = match.teamAwayPlayers[i].playerName.split(" ")[1];
        if (i < 11) {
          const options = {
            method: "GET",
            url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        ${process.env.TOKEN}`,
          };

          let s = "";
          try {
            request(options, async (error, response, body) => {
              s = JSON.parse(body);
              console.log("awayplayers", s);
              for (let ik = 0; ik < s?.data?.length; ik++) {
                console.log(
                  match.teamAwayPlayers[i].playerName.toLowerCase() ==
                    s?.data[ik]?.fullname.toLowerCase(),
                  "decent"
                );
                if (
                  match.teamAwayPlayers[i].playerName.toLowerCase() ==
                  s?.data[ik]?.fullname.toLowerCase()
                ) {
                  console.log("equal", s?.data[ik]?.image_path);
                  match.teamAwayPlayers[i].image = s?.data[ik]?.image_path;
                  console.log(ik, "ik");

                  await Player.create({
                    name: s?.data[ik]?.fullname,
                    firstname: s?.data[ik]?.firstname,
                    lastname: s?.data[ik]?.lastname,
                    image: s?.data[ik]?.image_path
                      ? s?.data[ik]?.image_path
                      : "https://cdn.sportmonks.com/images/cricket/placeholder.png",
                    id: match.teamAwayPlayers[i].playerId,
                    country_id: s?.data[ik]?.country_id,
                    dateofbirth: s?.data[ik]?.dateofbirth,
                  });
                }
              }
            });
          } catch (error) {
            console.log(error);
          }
        }
      }
      for (let i = 0; i < match.teamHomePlayers.length; i++) {
        const name = match.teamHomePlayers[i].playerName.split(" ")[1];
        if (i < 11) {
          const options = {
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
          try {
            request(options, async (error, response, body) => {
              s = JSON.parse(body);
              for (let ik = 0; ik < s?.data?.length; ik++) {
                if (
                  match.teamHomePlayers[i].playerName.toLowerCase() ==
                  s?.data[ik]?.fullname.toLowerCase()
                ) {
                  console.log("equal", s?.data[ik]?.image_path);
                  match.teamHomePlayers[i].image = s?.data[ik]?.image_path;
                  console.log(ik, "ik");
                  await Player.create({
                    name: s?.data[ik]?.fullname,
                    firstname: s?.data[ik]?.firstname,
                    lastname: s?.data[ik]?.lastname,
                    image: s?.data[ik]?.image_path
                      ? s?.data[ik]?.image_path
                      : "https://cdn.sportmonks.com/images/cricket/placeholder.png",
                    id: match.teamHomePlayers[i].playerId,
                    country_id: s?.data[ik]?.country_id,
                    dateofbirth: s?.data[ik]?.dateofbirth,
                  });
                }
              }
            });
          } catch (error) {
            console.log(error);
          }
        }
        await match.save();
      }
    } else {
      const date1 = "2679243";
    }
  }
};
