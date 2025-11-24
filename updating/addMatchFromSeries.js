const request = require("request");
const Match = require("../models/match");
const Contest = require("../models/contest");
const ContestType = require("../models/contestType");
const Series = require("../models/series");
const flagURLs = require("country-flags-svg");
const { getflag } = require("../utils/getflags");
const { matchkeys } = require("../utils/matchkeys");

//const createContestForMatch = require("./createContestForMatch"); // if needed

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Special logic for Ireland (and other similar teams)
function fixSpecialTeamFlag(teamName) {
    const specialFlags = {
        Ireland: "https://flagcdn.com/w320/ie.png",
        Scotland: "https://flagcdn.com/w320/gb-sct.png",
        England: "https://flagcdn.com/w320/gb-eng.png",
        Wales: "https://flagcdn.com/w320/gb-wls.png",
        UAE: "https://flagcdn.com/w320/ae.png",
        HongKong: "https://flagcdn.com/w320/hk.png",
        PapuaNewGuinea: "https://flagcdn.com/w320/pg.png",
    };

    const key = teamName.replace(/\s+/g, ""); // handle "Hong Kong" => "HongKong"

    return specialFlags[key];
}

async function getMatchesFromSeries(seriesId) {
    let key = await matchkeys()
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
    let now = new Date();
    let date = new Date();
    // Step 1: Get all ongoing series from DB
    const tenDaysLater = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days ahead
    // Fetch ongoing and upcoming series
    const ongoingSeries = await Series.find({
        $or: [
            // Ongoing series
            { startDate: { $lte: now }, endDate: { $gt: now } },
            // Upcoming series within 10 days
            { startDate: { $gt: now, $lte: tenDaysLater } }
        ]
    }).sort({ startDate: 1 }); // Optional: sort by startDate
    return ongoingSeries;
}

module.exports.addMatchesForAllCurrentSeries = async function () {
    //await Match.deleteMany({});
    const currentSeriesArr = await getCurrentSeries();
    //const currentSeriesArr = [{'seriesId':'6732'}]
    for (const series of currentSeriesArr) {
        const seriesId = series.seriesId;
        console.log(`Processing series: ${series.name} ${series.type} (${seriesId})`);
        try {
            type = series?.type?.charAt(0)?.toLowerCase() == 'w' ? 'i' : series?.type?.charAt(0)?.toLowerCase();
            //await Match.deleteMany({'seriesId':seriesId})
            console.log(type, 'type international')
            console.log('its international')
            const data = await getMatchesFromSeries(seriesId);
            await delay(3000);
            const matchDetailsArr = data.matchDetails || [];
            for (const item of matchDetailsArr) {
                if (!item.matchDetailsMap || !Array.isArray(item.matchDetailsMap.match)) continue;
                for (const match of item.matchDetailsMap.match) {
                    const info = match.matchInfo;
                    if (!info) continue;
                    console.log(info, 'info')
                    const matchId = info.matchId;
                    const existing = await Match.findOne({ matchId });
                    console.log(existing, 'is it tbc')
                    if (existing) {
                        if ((
                            existing.teamHomeCode?.toLowerCase() == "tbc" ||
                            existing.teamAwayCode?.toLowerCase() == "tbc"
                        )) {
                            console.log('it is tbc')
                            const teamHomeName = info.team1?.teamName?.toLowerCase();
                            const teamAwayName = info.team2?.teamName?.toLowerCase();
                            existing.teamHomeCode = info.team1?.teamSName;
                            existing.teamAwayCode = info.team2?.teamSName;
                            existing.teamHomeName = info.team1?.teamName;
                            existing.teamAwayName = info.team2?.teamName;
                            existing.teamHomeId = info.team1?.teamId;
                            existing.teamAwayId = info.team2?.teamId;
                            existing.seriesId = info.seriesId;
                            existing.type = type;
                            existing.series = series._id;
                            let teamAwayFlagUrl = flagURLs?.findFlagUrlByCountryName(teamAwayName);
                            let teamHomeFlagUrl = flagURLs?.findFlagUrlByCountryName(teamHomeName);
                            if (teamHomeName == "ireland") {
                                teamHomeFlagUrl = fixSpecialTeamFlag(teamHomeName);
                            }
                            if (teamAwayName == "ireland") {
                                teamAwayFlagUrl = fixSpecialTeamFlag(teamAwayName);
                            }
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
                        series: series._id,
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
                    if (teamHomeName == "ireland") {
                        teamHomeFlagUrl = fixSpecialTeamFlag(teamHomeName);
                    }
                    if (teamAwayName == "ireland") {
                        teamAwayFlagUrl = fixSpecialTeamFlag(teamAwayName);
                    }
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
        } catch (err) {
            console.error(`Error processing series ${seriesId}:`, err);
        }
    }
}

// Run for all current series
//addMatchesForAllCurrentSeries();
