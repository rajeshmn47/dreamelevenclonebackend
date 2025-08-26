const request = require("request");
const MatchLive = require("../models/matchlive");
const getkeys = require("../utils/crickeys");

module.exports.addInPlayStatusFS = async function () {
    try {
        //const keys = await getkeys.getkeys();
        const now = new Date();
        const endDate = new Date(now.getTime());
        const b = 100 * 60 * 60 * 1000 * 1;
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
                const matchHour = matchDate.getHours();   // e.g., 15 (3 PM)
                const currentHour = now.getHours();
                if (currentHour < matchHour) {
                    console.log(`Skipping Match ${matchId}, Stumps time not reached.`);
                    continue;
                }
            }

            if (match.result?.toLowerCase() == 'abandoned') {
                continue;
            }

            if (match.result?.toLowerCase() == 'innings break') {
                let inningsBreakDuration = format === "ODI" ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30 min (ODI) or 15 min (T20)
                const inningsBreakNextCheck = new Date(updatedAt.getTime() + inningsBreakDuration);

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
            const URL = process.env.BACKEND_URL || "http://localhost:3000";
            const apiUrl = `${URL}/api/match/live-status/${matchId}`;
            //const keys = await getkeys.getkeys();
            console.log(matchId, 'matchId')
            const options = {
                method: "GET",
                url: apiUrl,
                headers: {
                    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                    "X-RapidAPI-Key": "",
                    useQueryString: true,
                    "servertoken": process.env.SERVER_TOKEN,
                },
            };

            const promise = new Promise((resolve, reject) => {
                request(options, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(JSON.parse(body));
                });
            });

            promise
                .then(async (matchData) => {
                    //console.log(matchData, 'matchdata')
                    if (!matchData || !matchData.result) return;

                    const matchState = matchData.result.toLowerCase();
                    console.log(matchState, matchId, 'matchstate')
                    if (matchState.includes("stumps")) {
                        console.log(`Match ${matchId} is in Stumps, setting next check for next day.`);
                        //await MatchLive.updateOne({ matchId }, { isInPlay: false, stumpsTime: now });
                        return;
                    }

                    if (matchState.includes("innings break")) {
                        const breakDuration = format === "ODI" ? 30 * 60 * 1000 : 15 * 60 * 1000;
                        //await MatchLive.updateOne({ matchId }, { inningsBreakTime: now });
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

