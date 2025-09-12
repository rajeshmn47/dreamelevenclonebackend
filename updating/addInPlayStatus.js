const request = require("request");
const MatchLive = require("../models/matchlive");
const getkeys = require("../utils/crickeys");
const RapidApiKey = require("../models/rapidapikeys");

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.addInPlayStatus = async function () {
    try {
        //const keys = await getkeys.getkeys();
        const now = new Date();
        const endDate = new Date(now.getTime());
        const b = 120 * 60 * 60 * 1000 * 1;
        date = new Date(now.getTime() - b);
        // Fetch matches that are ongoing but not marked as "Complete"
        const matches = await MatchLive.find({
            isInPlay: false,
            result: { $ne: "Complete" },
            date: {
                $gte: new Date(date),
                $lt: new Date(endDate),
            },
        });

        console.log(matches?.length, 'matchesss')

        for (let match of matches) {
            console.log(match.result, 'result')
            const matchId = match.matchId;
            const format = match?.format?.toUpperCase();
            const lastUpdated = new Date(match.updatedAt);
            const matchDate = new Date(match.date);
            const updatedAt = new Date(match.updatedAt);
            const elapsedTime = now - lastUpdated;

            let nextCheckTime = 10 * 60 * 1000; // Default: 10 minutes

            // 🔹 **Check if API request should be delayed**
            console.log(match?.result, 'match result')
            if (match.result?.toLowerCase() == 'stumps') {
                const stumpsNextCheck = new Date(matchDate);
                stumpsNextCheck.setDate(stumpsNextCheck.getDate() + 1); // Next day check
                console.log(now, stumpsNextCheck, 'testing stumps')
                if (now < stumpsNextCheck) {
                    console.log(`Skipping Match ${matchId}, Stumps time not reached.`);
                    continue;
                }
            }

            if (match.result?.toLowerCase() == 'abandoned') {
                continue;
            }

            if (match.result?.toLowerCase() == 'innings break') {
                let inningsBreakDuration = format === "odi" ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30 min (ODI) or 15 min (T20)
                const inningsBreakNextCheck = new Date(updatedAt.getTime() + inningsBreakDuration);
                console.log(now, inningsBreakNextCheck, 'now')
                if (now < inningsBreakNextCheck) {
                    console.log(`Skipping Match ${matchId}, innings break ongoing.`);
                    continue;
                }
            }
            if (match.result?.toLowerCase() == 'delay') {
                let inningsBreakDuration = 60 * 60 * 1000; // 30 min (ODI) or 15 min (T20)
                const inningsBreakNextCheck = new Date(updatedAt.getTime() + inningsBreakDuration);

                if (now < inningsBreakNextCheck) {
                    console.log(`Skipping Match ${matchId}, innings break ongoing.`);
                    continue;
                }
            }
            if (match.result?.toLowerCase() == 'lunch') {
                let inningsBreakDuration = 40 * 60 * 1000; // 30 min (ODI) or 15 min (T20)
                const inningsBreakNextCheck = new Date(updatedAt.getTime() + inningsBreakDuration);
                console.log(now, inningsBreakNextCheck, 'now')
                if (now < inningsBreakNextCheck) {
                    console.log(match.result, 'check if pass')
                    console.log(`Skipping Match ${matchId}, innings break ongoing.`);
                    continue;
                }
            }
            const keys = await getkeys.getkeys(matchId);
            console.log(matchId, 'matchId')
            const options = {
                method: "GET",
                url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}`,
                headers: {
                    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                    "X-RapidAPI-Key": keys,
                    useQueryString: true,
                },
            };

            await delay(2000);

            const promise = new Promise((resolve, reject) => {
                request(options, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    console.log(body, 'body')
                    let s = JSON.parse(body);
                    resolve({ ...s, headers: response.headers });
                });
            });

            promise
                .then(async (matchData) => {
                    //console.log(matchData, 'matchdata')
                    if (!matchData) return;
                    const ratelimit = parseInt(matchData.headers['x-ratelimit-requests-remaining']);
                    await RapidApiKey.updateOne({ apiKey: keys }, { $set: { usageCount: ratelimit } })
                    const matchState = matchData.state.toLowerCase();
                    console.log(matchState, matchId, 'matchstate')
                    if (matchState.includes("stumps")) {
                        console.log(`Match ${matchId} is in Stumps, setting next check for next day.`);
                        await MatchLive.updateOne({ matchId }, { isInPlay: true });
                        return;
                    }

                    if (matchState.includes("innings break")) {
                        const breakDuration = format === "odi" ? 30 * 60 * 1000 : 15 * 60 * 1000;
                        await MatchLive.updateOne({ matchId }, { isInPlay: true });
                        console.log(`Match ${matchId} in innings break, checking after ${breakDuration / 60000} min.`);
                        return;
                    }
                    
                    console.log(matchState, 'matchstate')
                    if (matchState?.includes("in progress") || matchState?.includes("inprogress")) {
                        await MatchLive.updateOne({ matchId }, { isInPlay: true });
                        console.log(`Match ${matchId} resumed, updated isInPlay to true.`);
                    }

                    if (matchState.includes("complete")) {
                        await MatchLive.updateOne({ matchId }, { isInPlay: true });
                        console.log(`Match ${matchId} resumed, updated isInPlay to true.`);
                    }
                })
                .catch((error) => console.log(`Error fetching match ${matchId}:`, error));
        }
    } catch (error) {
        console.log("Error in addInPlayStatus:", error);
    }
};

