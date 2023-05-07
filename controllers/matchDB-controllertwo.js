const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const getkeys = require("../apikeys");

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
  request(options, function (error, response, body) {
    s = JSON.parse(body);
  });
  return s;
}

module.exports.addMatchtoDb = async function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  let obj = {
    results: [],
  };
  var date = new Date();
  var month = pad2(date.getMonth() + 1); //months (0-11)
  var day = pad2(date.getDate()); //day (1-31)
  var year = date.getFullYear();
  // var year = "2021";
  // var month = "09";
  // var day = 25;
  var date = new Date();
  const numberOfDays = 10;
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 6);
  console.log(
    date,
    endDate,
    date.getDate(),
    parseInt(
      parseInt(date.getFullYear()) +
        "-" +
        parseInt(date.getMonth() + 1) +
        "-" +
        parseInt(date.getDate())
    ),
    "date",
    "enddate"
  );
  date = parseInt(
    parseInt(date.getFullYear()) +
      "-" +
      parseInt(date.getMonth() + 1) +
      "-" +
      parseInt(date.getDate())
  );
  endDate = parseInt(
    parseInt(endDate.getFullYear()) +
      "-" +
      parseInt(endDate.getMonth() + 1) +
      "-" +
      parseInt(endDate.getDate())
  );
  for (let i = 0; i < numberOfDays; i++) {
    console.log("envkey");
    let keys = await getkeys.getkeys();
    const options = {
      method: "GET",
      url: `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[starts_between]=2023-04-27,2019-04-30&api_token=
      ${process.env.TOKEN}`,
      headers: {
        "x-rapidapi-host": "cricket-live-data.p.rapidapi.com",
        "x-rapidapi-key": keys,
        useQueryString: true,
      },
    };
    // Doubt in this part, is request is synchronous or non synchronous?
    let promise = new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        }
        // console.log(body)
        let s = JSON.parse(body);
        resolve(s);
      });
    });
    promise
      .then(async (s) => {
        console.log(s, "mad");
        for (mat of s.results) {
          obj.results.push(mat);
        }

        for (let i = 0; i < obj.results.length; i++) {
          let match1 = new Match();
          const matchId = obj.results[i].id;
          // console.log(obj.results[i]);
          match1.matchId = matchId;
          obj.results.sort(compare);
          match1.matchTitle = obj.results[i].match_title;
          match1.teamHomeName = obj.results[i].home.name;
          match1.teamAwayName = obj.results[i].away.name;
          match1.date = obj.results[i].date;
          if (obj.results[i].home.code == "") {
            continue;
          } else {
            match1.teamHomeCode = obj.results[i].home.code;
          }
          if (obj.results[i].away.code == "") {
            continue;
          } else {
            match1.teamAwayCode = obj.results[i].away.code;
          }
          try {
            let match = await Match.findOne({ matchId: matchId });
            if (!match) {
              let prize = [10000, 5000, 4000, 500];
              // let prizeBreakup = [
              //     5, 4, 3, 1
              // ];
              let totalspots = [50, 40, 30, 10];
              for (let j = 0; j < 4; j++) {
                let contest1 = new Contest();
                contest1.price = prize[j];
                contest1.totalSpots = totalspots[j];
                contest1.spotsLeft = totalspots[j];
                contest1.matchId = matchId;
                let prizeDetails = [
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
                  let contest2 = await Contest.create(contest1);
                  if (contest2) {
                    match1.contestId.push(contest2.id);
                  }
                } catch (err) {
                  console.log("Error : " + err);
                }
              }
              try {
                let match = await Match.create(match1);
                if (match) {
                  console.log("match is successfully added in db! ");
                }
              } catch (err) {
                console.log("Error : " + err);
              }
            } else {
              console.log("Match already exist in database! ");
            }
          } catch (err) {
            console.log("Error : " + err);
          }
        }
      })
      .catch((err) => {
        console.log("Error : " + err);
      });
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    var month = pad2(date.getMonth() + 1); //months (0-11)
    var day = pad2(date.getDate()); //day (1-31)
    var year = date.getFullYear();
    // day++;
    formattedDate = year + "-" + month + "-" + day;
  }
};
