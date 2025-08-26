const request = require("request");
const Match = require("../models/match");
const Contest = require("../models/contest");
const ContestType = require("../models/contestType");
const Series = require("../models/series");
const flagURLs = require("country-flags-svg");
const { getflag } = require("../utils/getflags");
const { getkeys } = require("../utils/crickeys");
//const createContestForMatch = require("./createContestForMatch"); // if needed

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMatchesFromSeries(seriesId) {
    let key = await getkeys();
    console.log(key, 'leys')
    const options = {
        method: "GET",
        url: `https://cricbuzz-cricket.p.rapidapi.com/series/v1/${seriesId}`,
        headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
        }
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) return reject(error);
            try {
                const data = JSON.parse(body);
                console.log(data, 'data from series')
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function getCurrentSeries() {
    const now = new Date();
    const startOf2023 = new Date("2016-01-01T00:00:00.000Z");
    const endOf2022 = new Date("2022-12-31T23:59:59.999Z");
    const currentSeries = await Series.find({
        startDate: { $lte: startOf2023 },
        //endDate: { $gte: now }
    });
    return currentSeries;
}

module.exports.addMatchesForAllCurrentSeries = async function () {
    //await Match.deleteMany({});
    const currentSeriesArr = await getCurrentSeries();
    //const currentSeriesArr = [{'seriesId':'6732'}]
    for (const series of currentSeriesArr) {
        const seriesId = series.seriesId;
        console.log(`Processing series: ${series.name} ${series.type} (${seriesId})`);
        try {
            type = series?.type?.charAt(0)?.toLowerCase()
            //await Match.deleteMany({'seriesId':seriesId})
            console.log(type,'type international')
            if (type == 'i') {
                console.log('its international')
                const data = await getMatchesFromSeries(seriesId);
                await delay(3000);
                const matchDetailsArr = data.matchDetails || [];
                for (const item of matchDetailsArr) {
                    if (!item.matchDetailsMap || !Array.isArray(item.matchDetailsMap.match) || (!type == 'i')) continue;
                    for (const match of item.matchDetailsMap.match) {
                        const info = match.matchInfo;
                        if (!info) continue;
                        console.log(info, 'info')
                        const matchId = info.matchId;
                        const existing = await Match.findOne({ matchId });
                        if (existing) {
                            if (
                                existing.teamHomeCode?.toLowerCase() === "tbc" ||
                                existing.teamAwayCode?.toLowerCase() === "tbc"
                            ) {
                                const teamHomeName = info.team1?.teamName?.toLowerCase();
                                const teamAwayName = info.team2?.teamName?.toLowerCase();
                                existing.teamHomeCode = info.team1?.teamSName;
                                existing.teamAwayCode = info.team2?.teamSName;
                                existing.teamHomeName = info.team1?.teamName;
                                existing.teamAwayName = info.team2?.teamName;
                                existing.seriesId = info.seriesId;
                                let teamAwayFlagUrl = flagURLs?.findFlagUrlByCountryName(teamAwayName);
                                let teamHomeFlagUrl = flagURLs?.findFlagUrlByCountryName(teamHomeName);
                                if (!teamAwayFlagUrl) teamAwayFlagUrl = getflag(teamAwayName);
                                if (!teamHomeFlagUrl) teamHomeFlagUrl = getflag(teamHomeName);
                                existing.teamHomeFlagUrl = teamHomeFlagUrl || "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
                                existing.teamAwayFlagUrl = teamAwayFlagUrl || "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
                                await existing.save();
                                console.log("Match is successfully updated in db!");
                            } else {
                                console.log(`Match ${matchId} already exists, skipping.`);
                            }
                            continue;
                        }
                        // Prepare match document
                        const match1 = new Match({
                            matchId: info.matchId,
                            matchTitle: info.seriesName + " - " + info.matchDesc,
                            seriesId: info.seriesId,
                            teamHomeName: info.team1?.teamName,
                            teamAwayName: info.team2?.teamName,
                            teamHomeId: info.team1?.teamId,
                            teamAwayId: info.team2?.teamId,
                            teamHomeCode: info.team1?.teamSName,
                            teamAwayCode: info.team2?.teamSName,
                            teamHomeFlagUrl: info.team1?.imageId,
                            teamAwayFlagUrl: info.team2?.imageId,
                            date: info.startDate,
                            enddate: info.endDate,
                            format: info.matchFormat?.toLowerCase(),
                            type: type,
                            venue: info.venueInfo?.ground,
                            city: info.venueInfo?.city,
                            timezone: info.venueInfo?.timezone,
                            status: info.status,
                            state: info.state,
                            contestId: []
                        });
                        teamHomeName = info.team1?.teamName
                        teamAwayName = info.team2?.teamName
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

                        // Create contests for this match
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
                                console.log(`Error creating contest: ${err}`);
                            }
                        }
                        try {
                            const match = await Match.create(match1);
                            if (match) {
                                console.log("Match is successfully added in db!");
                            }
                        } catch (err) {
                            console.log(`Error creating match: ${err}`);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error processing series ${seriesId}:`, err);
        }
    }
}

// Run for all current series
//addMatchesForAllCurrentSeries();
