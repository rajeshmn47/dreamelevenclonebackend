const request = require("request");
const axios = require("axios");
const Match = require("../models/matchtwo");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_scores_copy");
const User = require("../models/user");
const Player = require("../models/players");
const getkeys = require("../apikeys");

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

module.exports.addLivematchtodb = async function () {
  const turing = await MatchLive();
  let date = new Date();
  const endDate = new Date(date.getTime() - 10 * 60 * 60 * 1000);
  date = new Date(date.getTime() - 30 * 60 * 60 * 1000);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "matches");
  for (let i = 0; i < matches.length; i++) {
    const { matchId } = matches[i];
    const match = await MatchLive.findOne({ matchId });
    if (!match) {
      console.log("image");
    } else {
      let user = await User.findById("646c70679da9df38e6273a43");
      user.totalhits = user.totalhits + 1;
      await user.save();
      const keys = await getkeys.getkeys();
      const date1 = "2679243";
      const options = {
        method: "GET",
        url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}`,
        headers: {
          "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
          "X-RapidAPI-Key": keys,
          useQueryString: true,
        },
      };
      const promise = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          }
          const s = JSON.parse(body);

          resolve(s);
        });
      });
      promise
        .then(async (s) => {
          console.log(s.matchInfo.team1.playerDetails, "s");
          try {
            if (s.matchInfo.team1 != null && s.matchInfo.team1.length != 0) {
              const LiveMatchDet = new MatchLive();
              LiveMatchDet.matchId = matchId;
              LiveMatchDet.date = date1;
              const r = [];
              for (const x of s.matchInfo.team1.playerDetails) {
                if (x.role == "Unknown") {
                  x.position = "Batsman";
                }
                const a = {
                  playerId: x.id,
                  playerName: x.name,
                  image: x.faceImageId,
                  points: 4,
                  position: x.role,
                  batOrder: -1,
                };
                r.push(a);
              }
              const y = [];
              for (const x of s.matchInfo.team2.playerDetails) {
                if (x.role == "Unknown") {
                  x.position = "Batsman";
                }
                const playerDet = {
                  playerId: x.id,
                  playerName: x.name,
                  points: 4,
                  image: x.faceImageId,
                  position: x.role,
                  batOrder: -1,
                };
                y.push(playerDet);
              }
              LiveMatchDet.teamHomePlayers = r;
              LiveMatchDet.teamAwayPlayers = y;
              const m = await MatchLive.findOne({ matchId });
              LiveMatchDet._id = m._id;
              console.log(LiveMatchDet, "i");
              const match = await MatchLive.updateOne(
                { _id: m._id },
                LiveMatchDet
              );
              if (match) {
                console.log(
                  "Live Details of match is successfully added in db! "
                );
              }
            }
          } catch (err) {
            console.log(err);
          }
        })
        .catch((error) => console.log(error));
    }
  }
};
