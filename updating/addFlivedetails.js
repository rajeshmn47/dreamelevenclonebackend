// eslint-disable-next-line import/no-extraneous-dependencies
const request = require('request');
// eslint-disable-next-line import/no-unresolved, import/extensions
const FMatch = require('../models/fMatch');
const FMatchLive = require('../models/fMatchlive');
const User = require('../models/user');
// eslint-disable-next-line no-unused-vars
const Player = require('../models/players');
const getkeys = require('../utils/crickeys');
const db = require('./firebaseinitialize');
// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

// eslint-disable-next-line no-unused-vars
async function getplayerImage(name) {
  return 'https://cdn.sportmonks.com/images/cricket/placeholder.png';
}

module.exports.addLivematchtodb = async function () {
  let date = new Date();
  const endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
  date = new Date(date.getTime() - 2 * 60 * 60 * 1000);
  const matches = await FMatch.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < matches.length; i++) {
    const { matchId } = matches[i];
    // eslint-disable-next-line no-await-in-loop
    const match = await FMatchLive.findOne({ matchId });
    // eslint-disable-next-line no-empty
    if (match) {
    } else {
      const keys = await getkeys.getkeys();
      const date1 = "2679243";
      const options = {
        method: "GET",
        url: `https://footapi7.p.rapidapi.com/api/match/${matchId}/lineups`,
        headers: {
          "x-rapidapi-host": "footapi7.p.rapidapi.com",
          "X-RapidAPI-Key": "3e774772f1mshd335b4ddbbd2512p194714jsnb9cc15174c3b",
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
              LiveMatchDet.teamHomeId = s.matchInfo.team1.id;
              LiveMatchDet.teamAwayId = s.matchInfo.team2.id;
              const m = await MatchLive.findOne({ matchId });
              const match = await MatchLive.create(LiveMatchDet);
              if (match) {
                //await addMatchIds.addMatchIds();
                const cityRef = db.db.collection("cities").doc(m[i].matchId);
                const doc = await cityRef.get();
                if (!doc.exists) {
                  console.log("No such document!");
                  const citRef = db.db.collection("cities").doc(m[i].matchId);
                  const res = await citRef.set(
                    {
                      lineupsOut: true,
                    },
                    { merge: true }
                  );
                } else {
                  const citRef = db.db.collection('cities').doc(m[i].matchId);

                  const res = await citRef.set(
                    {
                      lineupsOut: true,
                    },
                    { merge: true }
                  );
                }
                console.log(
                  'Live Details of match is successfully added in db! '
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
