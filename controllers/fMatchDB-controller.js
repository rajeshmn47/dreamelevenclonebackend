const request = require("request");
const Match = require("../models/match");
const Contest = require("../models/contest");
const User = require("../models/user");
const getkeys = require("../utils/crickeys");
const FMatch = require("../models/fMatch ");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

function compare(a, b) {
  return a.date < b.date;
}

function getplayerImage(name) {
  const options = {
    method: "GET",
    url: `https://cricket.sportmonks.com/api/v2.0/players/?filter[lastname]=${name}&api_token=
        fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv`,
    headers: {
      "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
      "x-rapidapi-key": "773ece5d2bmsh8af64b6b53baed6p1e86c9jsnd416b0e51110",
      api_token: "fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv",
      useQueryString: true,
    },
    Authorization: {
      api_token: "fTWhOiGhie6YtMBmpbw10skSjTmSgwHeLg22euC5qLMR1oT1eC6PRc8sEulv",
    },
  };
  let s = "";
  request(options, (error, response, body) => {
    s = JSON.parse(body);
  });
  return s;
}

module.exports.addMatchtoDb = async function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  const obj = {
    results: [],
  };
  var date = new Date();
  const month = pad2(date.getMonth() + 1); // months (0-11)
  const day = pad2(date.getDate()); // day (1-31)
  const year = date.getFullYear();
  // var year = "2021";
  // var month = "09";
  // var day = 25;
  var date = new Date();
  for (let i = 0; i < 1; i++) {
    const options = {
      method: "GET",
      url: `https://footapi7.p.rapidapi.com/api/matches/${parseInt(date.getDate())}/${parseInt(date.getMonth()+1)}/${parseInt(date.getFullYear())}`,
      headers: {
        "x-rapidapi-host": "footapi7.p.rapidapi.com",
        "x-rapidapi-key": "3e774772f1mshd335b4ddbbd2512p194714jsnb9cc15174c3b",
        useQueryString: true,
      },
    };
    // Doubt in this part, is request is synchronous or non synchronous?
    const promise = new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        }
        // console.log(body)
        const s = JSON.parse(body);
        resolve(s);
      });
    });
    promise
      .then(async (s) => {
        console.log(Object.keys(s),'keys')
        for (se of s.events) {
                obj.results.push(se);
        }
        for (let i = 0; i < obj.results.length; i++) {
          const match1 = new FMatch();
          const { id } = obj.results[i];
          console.log(Object.keys(obj.results[i]),id,'match');
          match1.matchId = id;
          obj.results.sort(compare);
          match1.matchType='football';
          match1.matchTitle = obj.results[i].tournament.name;
          match1.teamHomeName = obj.results[i].homeTeam.name;
          match1.teamAwayName = obj.results[i].awayTeam.name;
          match1.teamHomeId = obj.results[i].homeTeam.id;
          match1.teamAwayId = obj.results[i].awayTeam.id;
          match1.date = new Date(obj.results[i].startTimestamp*1000);
          if (obj.results[i].homeTeam.name == "") {
            continue;
          } else {
            match1.teamHomeCode = obj.results[i].homeTeam.name;
          }
          if (obj.results[i].awayTeam.name == "") {
            continue;
          } else {
            match1.teamAwayCode = obj.results[i].awayTeam.name;
          }
          try {
            const match = await FMatch.findOne({ matchId:id });
            if (!match) {
              const prize = [10000, 5000, 4000, 500];
              // let prizeBreakup = [
              //     5, 4, 3, 1
              // ];
              const totalspots = [50, 40, 30, 10];
              for (let j = 0; j < 6; j++) {
                const contest1 = new Contest();
                contest1.price = prize[j];
                contest1.totalSpots = totalspots[j];
                contest1.spotsLeft = totalspots[j];
                contest1.matchId =id;
                const prizeDetails = [
                  {
                    prize: prize[j] * 0.35,
                  },
                  {
                    prize: prize[j] * 0.25,
                  },
                  {
                    prize: prize[j] * 0.15,
                  },
                  {
                    prize: prize[j] * 0.1,
                  },
                  {
                    prize: prize[j] * 0.05,
                  },
                ];
                contest1.prizeDetails = prizeDetails;
                contest1.numWinners = 5;
                try {
                  const contest2 = await Contest.create(contest1);
                  if (contest2) {
                    match1.contestId.push(contest2.id);
                  }
                } catch (err) {
                  console.log(`Error : ${err}`);
                }
              }
              try {
                const match = await FMatch.create(match1);
                if (match) {
                  console.log("match is successfully added in db! ");
                }
              } catch (err) {
                console.log(`Error : ${err}`);
              }
            } else {
              console.log("Match already exist in database! ");
            }
          } catch (err) {
            console.log(`Error : ${err}`);
          }
        }
      })
      .catch((err) => {
        console.log(`Error : ${err}`);
      });
    // day++;
  }
};
