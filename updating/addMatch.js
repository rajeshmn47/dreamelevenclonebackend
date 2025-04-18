const request = require("request");
const Match = require("../models/match");
const Contest = require("../models/contest");
const MatchLiveDetails = require("../models/matchlive");
const ContestType = require("../models/contestType");
const { getflag } = require("../utils/getflags");
const flagURLs = require("country-flags-svg");

function compare(a, b) {
  return a.date < b.date;
}

module.exports.addMatchtoDb = async function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  console.log('add match')
  const obj = {
    results: [],
  };
  var date = new Date();
  const month = pad2(date.getMonth() + 1); // months (0-11)
  const day = pad2(date.getDate()); // day (1-31)
  const year = date.getFullYear();
  var date = new Date();
  const numberOfDays = 1;
  let endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000 * 6);
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
  for (let i = 0; i < 1; i++) {
    const options = {
      method: "GET",
      url: "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming",
      headers: {
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
        "x-rapidapi-key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
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
        for (se of s.typeMatches) {
          for (k of se.seriesMatches) {
            if (k?.seriesAdWrapper?.matches) {
              for (f of k?.seriesAdWrapper?.matches) {
                obj.results.push(f.matchInfo);
              }
            }
          }
        }
        for (let i = 0; i < obj.results.length; i++) {
          const match1 = new Match();
          const { matchId } = obj.results[i];
          console.log(matchId, 'results');
          match1.matchId = matchId;
          obj.results.sort(compare);
          match1.matchTitle = obj.results[i].seriesName;
          match1.format = obj.results[i].matchFormat.toLowerCase();
          match1.teamHomeName = obj.results[i].team1.teamName;
          match1.teamAwayName = obj.results[i].team2.teamName;
          match1.teamHomeId = obj.results[i].team1.teamId;
          match1.teamAwayId = obj.results[i].team2.teamId;
          match1.date = obj.results[i].startDate;
          match1.enddate = obj.results[i].endDate;
          let teamHomeName = obj.results[i].team1.teamName?.toLowerCase();
          let teamAwayName = obj.results[i].team2.teamName?.toLowerCase();
          let teamAwayFlagUrl = flagURLs?.findFlagUrlByCountryName(
            teamAwayName
          );
          let teamHomeFlagUrl = flagURLs?.findFlagUrlByCountryName(
            teamHomeName
          );
          if (!teamAwayFlagUrl) {
            teamAwayFlagUrl = getflag(teamAwayName);
          }
          if (!teamHomeFlagUrl) {
            teamHomeFlagUrl = getflag(teamHomeName);
          }
          match1.teamHomeFlagUrl = teamHomeFlagUrl ? teamHomeFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
          match1.teamAwayFlagUrl = teamAwayFlagUrl ? teamAwayFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
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
              const contestTypes = await ContestType.find({});
              for (let k = 0; k < contestTypes.length; k++) {
                const prizeDetails = contestTypes[k].prizes.map(prize => ({
                  prize: prize.amount,
                  prizeHolder: ""
                }));

                const contest1 = new Contest({
                  price: contestTypes[k].prize,
                  totalSpots: contestTypes[k].totalSpots,
                  spotsLeft: contestTypes[k].totalSpots,
                  matchId: matchId,
                  prizeDetails: prizeDetails,
                  numWinners: contestTypes[k].numWinners,
                  entryFee: contestTypes[k].entryFee,
                });

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
                const match = await Match.create(match1);
                if (match) {
                  console.log("match is successfully added in db! ");
                }
              } catch (err) {
                console.log(`Error : ${err}`);
              }
            } else if (match.teamHomeCode.toLowerCase() == "tbc" || match.teamAwayCode.toLowerCase() == "tbc") {
              let teamHomeName = obj.results[i].team1.teamName?.toLowerCase();
              let teamAwayName = obj.results[i].team2.teamName?.toLowerCase();
              match.teamHomeCode = obj.results[i].team1.teamSName;
              match.teamAwayCode = obj.results[i].team2.teamSName;
              match.teamHomeName = obj.results[i].team1.teamName;
              match.teamAwayName = obj.results[i].team2.teamName;
              let teamAwayFlagUrl = flagURLs?.findFlagUrlByCountryName(
                teamAwayName
              );
              let teamHomeFlagUrl = flagURLs?.findFlagUrlByCountryName(
                teamHomeName
              );
              if (!teamAwayFlagUrl) {
                teamAwayFlagUrl = getflag(teamAwayName);
              }
              if (!teamHomeFlagUrl) {
                teamHomeFlagUrl = getflag(teamHomeName);
              }
              match.teamHomeFlagUrl = teamHomeFlagUrl ? teamHomeFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
              match.teamAwayFlagUrl = teamAwayFlagUrl ? teamAwayFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
              await match.save();
              console.log("match is successfully updated in db! ");
            }
          } catch (err) {
            console.log(`Error : ${err}`);
          }
        }
      })
      .catch((err) => {
        console.log(`Error : ${err}`);
      });
  }
};
