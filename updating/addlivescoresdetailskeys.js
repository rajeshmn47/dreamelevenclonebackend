const request = require("request");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const { getkeys } = require("../utils/crickeys");
const { isInPlay } = require("../utils/isInPlay");
const Series = require("../models/series");
const RapidApiKey = require("../models/rapidapikeys");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pointCalculator(
  runs,
  fours,
  sixes,
  strikeRate,
  wicket,
  economy,
  balls
) {
  let totalPoints = runs + fours * 1 + sixes * 2 + 25 * wicket;
  while (runs >= 50) {
    totalPoints += 20;
    runs -= 50;
  }
  if (strikeRate < 100 && balls > 10) {
    totalPoints -= 5;
  }
  if (economy >= 12) {
    totalPoints -= 5;
  }
  return totalPoints + 4;
}

function convertWicketsData(wicketsData) {
  return Object.keys(wicketsData).map(key => wicketsData[key]);
}

module.exports.addLivescoresDetailsCustom = async function (format) {
  //await Match.updateMany({},{$set:{importance:'medium'}})
  let date = new Date();
  const endDate = new Date(date.getTime());
  const b = 120 * 60 * 60 * 1000;
  date = new Date(date.getTime() - b);
  let matches;
  if (format == "low" || format == "high" || format == "very_high") {
    matches = await Match.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      }
    }).populate("series");
    console.log(format, 'importance')
    matches = matches.filter(m => {
      if (!m.seriesId) return false;
      return m.importance == format || m.series.importance == format
    });
  }
  else {
    matches = await Match.find({
      format: format,
      importance: "medium",
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      },
    });
  }

  console.log(matches?.length, 'matchestz')
  for (let i = 0; i < matches.length; i++) {
    try {
      const matchId = matches[i].matchId;
      const match = await MatchLive.findOne({ matchId: matchId });
      if ((!match) || match?.result == "Complete" || !(match?.isInPlay)) {
        //console.log(match, 'matchId')
        continue;
      } else {
        const keys = await getkeys(matchId);
        console.log(matchId, 'jeys');
        const date1 = matches[i].date;
        const options = {
          method: "GET",
          url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/hscard`,
          headers: {
            "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
            "X-RapidAPI-Key": keys,
            useQueryString: true,
          },
        };

        await delay(1000); // Add a delay of 1 second between requests

        const promise = new Promise((resolve, reject) => {
          request(options, (error, response, body) => {
            if (error) {
              console.log(error, 'error');
              reject(error);
            }
            console.log(response.headers, body, 'body');
            const s = JSON.parse(body);
            resolve({ ...s, headers: response.headers });
          });
        });
        try {
          promise
            .then(async (s) => {
              //console.log(s, 'rrr');
              const ratelimit = parseInt(s.headers['x-ratelimit-requests-remaining']);
              let usageCount = 100 - ratelimit;
              console.log(usageCount, 'usage count')
              if (usageCount >= 100) {
                console.log("usage count 100", 100)
                await RapidApiKey.updateOne({ apiKey: keys }, { $set: { status: 'inactive' } })
                // 2. Find the *next* available key that is inactive, oldest updated first
                const nextKey = await RapidApiKey.findOne({ type: "scores", status: "inactive" })
                  .sort({ updatedAt: 1 });
                if (nextKey) {
                  // 3. Activate it
                  await RapidApiKey.updateOne(
                    { _id: nextKey._id },
                    { $set: { status: "active", updatedAt: new Date() } }
                  );
                  console.log("Switched to new API key:", nextKey.apiKey);
                } else {
                  console.error("⚠️ No more RapidAPI keys available!");
                }
              }
              else if (usageCount > 0) {
                await RapidApiKey.updateMany({ type: 'scores' }, { $set: { status: 'inactive' } })
                await RapidApiKey.updateOne({ apiKey: keys }, { $set: { usageCount: usageCount, status: 'active' } })
              }
              else if (!usageCount || (!keys)) {
                console.log("mcd")

                await RapidApiKey.updateOne({ type: 'scores', status: 'active' }, { $set: { status: 'inactive' } })
                // 2. Find the *next* available key that is inactive, oldest updated first
                const nextKey = await RapidApiKey.findOne({ type: "scores", status: "inactive" })
                  .sort({ updatedAt: 1 });

                if (nextKey) {
                  // 3. Activate it
                  await RapidApiKey.updateOne(
                    { _id: nextKey._id },
                    { $set: { status: "active", updatedAt: new Date() } }
                  );
                  console.log("Switched to new API key:", nextKey.apiKey);
                } else {
                  console.error("⚠️ No more RapidAPI keys available!");
                }
              }
              if (s.scorecard != 0 && s.scorecard.length > 0) {
                const LiveMatchDet = new MatchLive();
                LiveMatchDet.matchId = matchId;
                LiveMatchDet.date = date1;
                const inPlay = "Yes";
                const { status } = s.status;
                const toss = matches[i]?.teamHomeName;
                const result = s.ismatchcomplete ? "Complete" : "In Progress";
                let isinplay = isInPlay(result, matches[i].date);
                let title_fi = "";
                let home_first = false;
                let overs_fi = 0;
                let runs_fi = 0;
                let wickets_fi = 0;
                let fow_fi = "";
                let extrasDetails_fi = "";
                let batting1 = [];
                let bowling1 = [];
                let title_si = "";
                let overs_si = 0;
                let runs_si = 0;
                let wickets_si = 0;
                let fow_si = "";
                let extrasDetails_si = "";
                let batting2 = [];
                let bowling2 = [];
                let wicketsDataFI = [];
                let wicketsDataSI = [];
                if (s.scorecard.length > 0) {
                  batting1 = s.scorecard[0].batsman;
                  bowling1 = s.scorecard[0].bowler;
                  title_fi = s.scorecard[0].batteamname;
                  home_first =
                    matches[i].teamHomeName.toLowerCase() ==
                    s.scorecard[0].batteamname.toLowerCase();
                  overs_fi = s.scorecard[0].overs;
                  runs_fi = s.scorecard[0].score;
                  wickets_fi = s.scorecard[0].wickets;
                  fow_fi = s.scorecard[0].wickets;
                  extrasDetails_fi = s.scorecard[0].extras.total;
                  wicketsDataFI = s.scorecard[0].fow.fow;
                }
                console.log(s.scorecard, s.scorecard.length, "batting")
                if (s.scorecard.length > 1) {
                  batting2 = s.scorecard[1].batsman;
                  bowling2 = s.scorecard[1].bowler;
                  title_si = s.scorecard[1].batteamname;
                  overs_si = s.scorecard[1].overs;
                  runs_si = s.scorecard[1].score;
                  wickets_si = s.scorecard[1].wickets;
                  fow_si = s.scorecard[1].wickets;
                  extrasDetails_si = s.scorecard[1].extras.total;
                  wicketsDataSI = s.scorecard[1].fow.fow;
                }
                const { teamHomePlayers } = match;
                const { teamAwayPlayers } = match;
                //console.log(teamHomePlayers, teamAwayPlayers, "playing 11")
                const batting = [];
                const ke = Object.keys(batting1);
                for (let i = 0; i < ke.length; i++) {
                  batting.push(batting1[ke[i]]);
                }
                const kf = Object.keys(batting2);
                for (let i = 0; i < kf.length; i++) {
                  batting.push(batting2[kf[i]]);
                }
                const bowling = [];
                const kg = Object.keys(bowling1);
                for (let i = 0; i < kg.length; i++) {
                  bowling.push(bowling1[kg[i]]);
                }
                const kh = Object.keys(bowling2);
                for (let i = 0; i < kh.length; i++) {
                  bowling.push(bowling2[kh[i]]);
                }
                for (let i = 0; i < teamHomePlayers.length; i++) {
                  const player = teamHomePlayers[i];
                  const { playerId } = player;
                  for (const batter of batting) {
                    if (batter.id == playerId) {
                      teamHomePlayers[i].runs = batter.runs;
                      teamHomePlayers[i].balls = batter.balls;
                      teamHomePlayers[i].fours = batter.boundaries;
                      teamHomePlayers[i].sixes = batter.sixes;
                      teamHomePlayers[i].strikeRate = batter.strikeRate;
                      teamHomePlayers[i].howOut = batter.outdec;
                      teamHomePlayers[i].batOrder = 0;
                    }
                  }

                  for (const bowler of bowling) {
                    const player = teamHomePlayers[i];
                    const { playerId } = player;
                    if (bowler.id == playerId) {
                      teamHomePlayers[i].overs = bowler.overs;
                      teamHomePlayers[i].maidens = bowler.maidens;
                      teamHomePlayers[i].runsConceded = bowler.runs;
                      teamHomePlayers[i].wickets = bowler.wickets;
                      teamHomePlayers[i].economy = bowler.economy;
                    }
                  }
                  teamHomePlayers[i].points = pointCalculator(
                    teamHomePlayers[i].runs,
                    teamHomePlayers[i].fours,
                    teamHomePlayers[i].sixes,
                    teamHomePlayers[i].strikeRate,
                    teamHomePlayers[i].wickets,
                    teamHomePlayers[i].economy,
                    teamHomePlayers[i].balls
                  );
                }
                for (let i = 0; i < teamAwayPlayers.length; i++) {
                  const player = teamAwayPlayers[i];
                  const { playerId } = player;
                  for (const batter of batting) {
                    if (batter.id == playerId) {
                      teamAwayPlayers[i].runs = batter.runs;
                      teamAwayPlayers[i].balls = batter.balls;
                      teamAwayPlayers[i].fours = batter.boundaries;
                      teamAwayPlayers[i].sixes = batter.sixes;
                      teamAwayPlayers[i].strikeRate = batter.strikeRate;
                      teamAwayPlayers[i].howOut = batter.outdec;
                      teamAwayPlayers[i].batOrder = 0;
                    }
                  }

                  for (const bowler of bowling) {
                    const player = teamAwayPlayers[i];
                    const { playerId } = player;
                    if (bowler.id == playerId) {
                      teamAwayPlayers[i].overs = bowler.overs;
                      teamAwayPlayers[i].maidens = bowler.maidens;
                      teamAwayPlayers[i].runsConceded = bowler.runs;
                      teamAwayPlayers[i].wickets = bowler.wickets;
                      teamAwayPlayers[i].economy = bowler.economy;
                    }
                  }
                  teamAwayPlayers[i].points = pointCalculator(
                    teamAwayPlayers[i].runs,
                    teamAwayPlayers[i].fours,
                    teamAwayPlayers[i].sixes,
                    teamAwayPlayers[i].strikeRate,
                    teamAwayPlayers[i].wickets,
                    teamAwayPlayers[i].economy,
                    teamAwayPlayers[i].balls
                  );
                }
                try {
                  const matchUpdate = await MatchLive.updateOne(
                    { matchId },
                    {
                      $set: {
                        inPlay,
                        status,
                        toss,
                        result,
                        isInPlay: isinplay,
                        teamHomePlayers,
                        teamAwayPlayers,
                        date: matches[i].date,
                        titleFI: title_fi,
                        isHomeFirst: home_first,
                        oversFI: overs_fi,
                        wicketsFI: wickets_fi,
                        runFI: runs_fi,
                        fowFI: fow_fi,
                        extrasDetailFI: extrasDetails_fi,
                        titleSI: title_si,
                        oversSI: overs_si,
                        wicketsSI: wickets_si,
                        runSI: runs_si,
                        fowSI: fow_si,
                        extrasDetailSI: extrasDetails_si,
                        wicketsDataFI: wicketsDataFI,
                        wicketsDataSI: wicketsDataSI,
                      },
                    }
                  );
                } catch (err) {
                  console.log(`Error : ${err}`);
                }
              } else {
                if (s?.matchHeader) {
                  const { status } = s?.matchHeader;
                  const toss = s.matchHeader.tossResults.tossWinnerName;
                  const result = s.matchHeader.state;
                  let isinplay = isInPlay(result, matches[i].date);
                  const matchUpdate = await MatchLive.updateOne(
                    { matchId },
                    {
                      $set: {
                        isInPlay: isinplay,
                      },
                    }
                  );
                }
                else {
                  console.log('lkb')
                }
              }
            })
        }
        catch (error) {
          console.log(error, 'zerrror');
          await RapidApiKey.updateOne({ type: 'scores', status: 'active' }, { $set: { status: 'inactive' } })
          // 2. Find the *next* available key that is inactive, oldest updated first
          const nextKey = await RapidApiKey.findOne({ type: "scores", status: "inactive" })
            .sort({ updatedAt: 1 });

          if (nextKey) {
            // 3. Activate it
            await RapidApiKey.updateOne(
              { _id: nextKey._id },
              { $set: { status: "active", updatedAt: new Date() } }
            );
            console.log("Switched to new API key:", nextKey.apiKey);
          } else {
            console.error("⚠️ No more RapidAPI keys available!");
          }
        }

      }
    }
    catch (error) {

      const nextKey = await RapidApiKey.findOne({ type: "scores", status: "inactive" }).sort({ updatedAt: 1 });
      if (nextKey) {
        // 3. Activate it
        await RapidApiKey.updateOne(
          { _id: nextKey._id },
          { $set: { status: "active", updatedAt: new Date() } }
        );
      }
    }
  }
}