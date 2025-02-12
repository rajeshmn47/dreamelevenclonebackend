const request = require("request");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const getkeys = require("../utils/crickeys");
// function prizeBreakupRules(prize, numWinners){
//     let prizeMoneyBreakup = [];
//     for(let i = 0; i < numWinners; i++){

//     }
// }

module.exports.addInPlayStatus = async function () {
    try {
        const keys = await getkeys.getkeys();

        // Fetch matches that are ongoing but not marked as isInPlay
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const matches = await MatchLive.find({
            isInPlay: false, // We need to check these
            result: { $ne: "Complete" }, // Exclude completed matches
            date: { $gte: fiveDaysAgo }
        });
        //console.log(matches, 'matches')
        for (let match of matches) {
            const matchId = match.matchId;
            const format = match?.format?.toUpperCase(); // "ODI", "T20", "Test"
            const lastUpdated = new Date(match.updatedAt); // Last time we updated this match
            const now = new Date();

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
                    const matchData = JSON.parse(body);
                    resolve(matchData);
                });
            });

            promise
                .then(async (matchData) => {
                    if (!matchData || !matchData.matchInfo) return;

                    const matchState = matchData.matchInfo.state.toLowerCase(); // e.g., "stumps", "innings break", "in play"

                    // 🔹 Handling Stumps 🔹
                    if (matchState.includes("stumps")) {
                        const matchDate = new Date(match.date);
                        const nextDay = new Date(matchDate);
                        nextDay.setDate(nextDay.getDate() + 1); // Move to next day

                        console.log(`Match ${matchId} is in Stumps, setting next check for ${nextDay}`);
                        await MatchLive.updateOne({ matchId }, { isInPlay: false, nextCheck: nextDay });
                        return;
                    }

                    // 🔹 Handling Innings Break 🔹
                    if (matchState.includes("innings break")) {
                        let breakDuration = 0;
                        if (format === "ODI") breakDuration = 30 * 60 * 1000; // 30 minutes
                        if (format === "T20") breakDuration = 10 * 60 * 1000; // 1 minute

                        const elapsedTime = now - lastUpdated;
                        if (elapsedTime < breakDuration) {
                            console.log(`Match ${matchId} is still in break, waiting...`);
                            return;
                        }
                    }

                    // 🔹 Handling Match Resume 🔹
                    if (matchState.includes("in progress")) {
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
