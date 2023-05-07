const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const axios = require("axios");
const User = require("../models/user");

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

module.exports.addPlayers = async function () {
  const turing = await MatchLive();
  let date = new Date();
  let endDate = new Date(date.getTime() + 60 * 60 * 1000);
  date = new Date(date.getTime() - 60 * 60 * 1000 * 10);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  const user = await User.findById("63c18c9f2d217ea120307e30");
  for (let i = 0; i < matches.length; i++) {
    let match = await MatchLive.findOne({ matchId: matches[i].matchId });
    if (match) {
      try {
        for (let i = 0; i < match.teamAwayPlayers.length; i++) {
          let name = match.teamAwayPlayers[i].playerName.split(" ")[1];
          if (i < 11) {
            let options = {
              method: "GET",
              url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        ${process.env.TOKEN}`,
            };

            let s = "";

            const foundpl = await Player.findOne({
              id: match.teamAwayPlayers[i].playerId,
            });
            if (foundpl) {
              match.teamAwayPlayers[i].image = foundpl.image;
            } else {
              request(options, async function (error, response, body) {
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
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
      for (let i = 0; i < match.teamHomePlayers.length; i++) {
        let name = match.teamHomePlayers[i].playerName.split(" ")[1];
        if (i < 11) {
          let s = "";
          try {
            for (let i = 0; i < match.teamHomePlayers.length; i++) {
              let name = match.teamHomePlayers[i].playerName.split(" ")[1];
              if (i < 11) {
                let options = {
                  method: "GET",
                  url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
            ${process.env.TOKEN}`,
                };

                let s = "";

                const foundpl = await Player.findOne({
                  id: match.teamHomePlayers[i].playerId,
                });
                if (foundpl) {
                  match.teamHomePlayers[i].image = foundpl.image;
                } else {
                  request(options, async function (error, response, body) {
                    s = JSON.parse(body);
                    console.log("awayplayers", s);
                    for (let ik = 0; ik < s?.data?.length; ik++) {
                      console.log(
                        match.teamHomePlayers[i].playerName.toLowerCase() ==
                          s?.data[ik]?.fullname.toLowerCase(),
                        "decent"
                      );
                      if (
                        match.teamHomePlayers[i].playerName.toLowerCase() ==
                        s?.data[ik]?.fullname.toLowerCase()
                      ) {
                        console.log("equal", s?.data[ik]?.image_path);
                        match.teamHomePlayers[i].image =
                          s?.data[ik]?.image_path;
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
                }
              }
            }
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
