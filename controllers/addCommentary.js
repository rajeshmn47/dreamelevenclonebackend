const Match = require("../models/match");
const request = require("request");
const Contest = require("../models/contest");
const MatchLiveDetails = require("../models/match_live_details_new");
const addLiveCommentary = require("./firebase");

// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

module.exports.addcommentary = async function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  let obj = {
    results: [],
  };
  //months (0-11)
  // var year = "2021";
  // var month = "09";
  // var day = 25;
  var formattedDate = 2023 + "-" + 01 + "-" + 13;
  const numberOfDays = 4;
  let getim = new Date().getTime();

  const axios = require("axios");

  let date = new Date();
  let endDate = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  date = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  const matches = await Match.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  let type = ["international", "league", "domestic", "women"];
  for (let ty = 0; ty < type.length; ty++) {
    const options = {
      method: "GET",
      url: `https://cricbuzz-cricket.p.rapidapi.com/schedule/v1/${type[ty]}`,
      headers: {
        "X-RapidAPI-Key": "a5da117d90msh3e694894d3b7dbfp12cc3bjsn8167b3fc201c",
        "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options);
      let list = response.data.matchScheduleMap;
      for (let i = 0; i < list.length; i++) {
        for (
          let j = 0;
          j < list[i].scheduleAdWrapper?.matchScheduleList?.length;
          j++
        ) {
          let info =
            list[i]?.scheduleAdWrapper?.matchScheduleList[j]?.matchInfo[0];
          for (let k = 0; k < matches.length; k++) {
            let b = new Date(parseInt(info.startDate));
            let a = new Date(matches[k].date);
            if (a.getMonth() == b.getMonth() && a.getDate() == b.getDate()) {
              let teama = info.team1.teamName.toLowerCase();
              let teamb = info.team2.teamName.toLowerCase();
              let teamab = matches[k].teamHomeName.toLowerCase();
              let teamcd = matches[k].teamAwayName.toLowerCase();
              if (teama == teamab && teamb == teamcd) {
                matches[k].cmtMatchId = info.matchId;
                let ab = await MatchLiveDetails.findOne({
                  matchId: matches[k].matchId,
                });
                console.log(ab, "ab");
                if (ab) {
                  console.log(ab, "ab");
                  ab.cmtMatchId = info.matchId;
                  await ab.save();
                }
                let at = await matches[k].save();
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
};
