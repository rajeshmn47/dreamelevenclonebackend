const request = require("request");
const Match = require("../models/match");
const Contest = require("../models/contest");
const User = require("../models/user");
const getkeys = require("../crickeys");

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
  const numberOfDays = 1;
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 6);
  console.log(
    date,
    endDate,
    date.getDate(),
    parseInt(
      `${parseInt(date.getFullYear())}-${parseInt(
        date.getMonth() + 1
      )}-${parseInt(date.getDate())}`
    ),
    "date",
    "enddate"
  );
  date = parseInt(
    `${parseInt(date.getFullYear())}-${parseInt(
      date.getMonth() + 1
    )}-${parseInt(date.getDate())}`
  );
  endDate = parseInt(
    `${parseInt(endDate.getFullYear())}-${parseInt(
      endDate.getMonth() + 1
    )}-${parseInt(endDate.getDate())}`
  );
  for (let i = 0; i < numberOfDays; i++) {
    console.log("envkey");
    const keys = await getkeys.getkeys();
    let user = await User.findById("646c70679da9df38e6273a43");
    user.totalhits = user.totalhits + 1;
    await user.save();
    const options = {
      method: "GET",
      url: "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming",
      headers: {
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
        "x-rapidapi-key": keys,
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
        console.log(s.typeMatches, "mad");
        for (se of s.typeMatches) {
          for (k of se.seriesMatches) {
            if (k?.seriesAdWrapper?.matches) {
              for (f of k?.seriesAdWrapper?.matches) {
                console.log(f.matchInfo.matchId, "id");
                obj.results.push(f.matchInfo);
              }
            }
          }
        }
        for (let i = 0; i < obj.results.length; i++) {
          const match1 = new Match();
          console.log(obj.results[i], match1, "okkkk");
          const { matchId } = obj.results[i];
          // console.log(obj.results[i]);
          match1.matchId = matchId;
          obj.results.sort(compare);
          match1.matchTitle = obj.results[i].seriesName;
          match1.teamHomeName = obj.results[i].team1.teamName;
          match1.teamAwayName = obj.results[i].team2.teamName;
          match1.teamHomeId = obj.results[i].team1.teamId;
          match1.teamAwayId = obj.results[i].team2.teamId;
          match1.date = obj.results[i].startDate;
          if (obj.results[i].team1.teamSName == "") {
            continue;
          } else {
            match1.teamHomeCode = obj.results[i].team1.teamSName;
          }
          if (obj.results[i].team2.teamSName == "") {
            continue;
          } else {
            match1.teamAwayCode = obj.results[i].team2.teamSName;
          }
          try {
            const match = await Match.findOne({ matchId });
            if (!match) {
              const prize = [10000, 5000, 4000, 500];
              // let prizeBreakup = [
              //     5, 4, 3, 1
              // ];
              const totalspots = [50, 40, 30, 10, 0, 0];
              for (let j = 0; j < 6; j++) {
                const contest1 = new Contest();
                contest1.price = prize[j];
                contest1.totalSpots = totalspots[j];
                contest1.spotsLeft = totalspots[j];
                contest1.matchId = matchId;
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
                console.log(match1, "match1");
                const match = await Match.create(match1);
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
