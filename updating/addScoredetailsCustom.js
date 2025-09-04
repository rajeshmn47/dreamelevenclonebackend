const fetch = require("node-fetch");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const { isInPlay } = require("../utils/isInPlay");

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pointCalculator(runs, fours, sixes, strikeRate, wicket, economy, balls) {
    let totalPoints = runs + fours * 1 + sixes * 2 + 25 * wicket;
    while (runs >= 50) {
        totalPoints += 20;
        runs -= 50;
    }
    if (strikeRate < 100 && balls > 10) totalPoints -= 5;
    if (economy >= 12) totalPoints -= 5;
    return totalPoints + 4;
}

function convertWicketsData(wicketsData) {
    return Object.keys(wicketsData).map(key => wicketsData[key]);
}

module.exports.addLivescoresDetailsCustomfs = async function (format) {
    let date = new Date();
    const endDate = new Date(date.getTime());
    const b = 120 * 60 * 60 * 1000 * 1;
    date = new Date(date.getTime() - b);
    const URL = process.env.BACKEND_URL
    let matches;
    if (format === 'important' || format === 'notImportant') {
        if (format === 'important') {
            matches = await Match.find({
                date: {
                    $gte: new Date(date),
                    $lt: new Date(endDate),
                }, important: true
            });
        } else {
            matches = await Match.find({
                date: {
                    $gte: new Date(date),
                    $lt: new Date(endDate),
                }, notImportant: true
            });
        }
    }
    else {
        matches = await Match.find({
            format: format,
            date: {
                $gte: new Date(date),
                $lt: new Date(endDate),
            },
        });
    }
    console.log(matches?.length, 'matchest')
    for (const matchDoc of matches) {
        const { matchId, date } = matchDoc;
        const existingLive = await MatchLive.findOne({ matchId });
        if ((!existingLive || existingLive.result === "Complete" || !existingLive.isInPlay)) {
            console.log(`Match ${matchId} is not in play or already completed.`);
            continue;
        }
        const apiUrl = `${URL}/api/match/live-scores/${matchId}`;

        try {
            await delay(100);
            const res = await fetch(apiUrl, {
                headers: {
                    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                    "X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
                    "servertoken": process.env.SERVER_TOKEN,
                    useQueryString: true,
                },
            });
            const s = await res.json();
            console.log(s, 's')
            if (!s || !s.matchHeader) continue;

            const matchLiveData = {
                matchId,
                date,
                inPlay: "Yes",
                status: s.matchHeader.status,
                toss: s.matchHeader.tossResults?.tossWinnerName || "",
                result: s.matchHeader.state,
                isInPlay: isInPlay(s.matchHeader.state, date)
            };

            if (s.scoreCard?.length > 0) {
                const sc0 = s.scoreCard[0];
                const sc1 = s.scoreCard[1] || {};

                const teamHome = matchDoc.teamHomeName.toLowerCase();
                const bat0 = sc0.batTeamDetails.batTeamName.toLowerCase();

                Object.assign(matchLiveData, {
                    titleFI: sc0.batTeamDetails.batTeamName,
                    isHomeFirst: teamHome === bat0,
                    oversFI: sc0.scoreDetails.overs,
                    wicketsFI: sc0.scoreDetails.wickets,
                    runFI: sc0.scoreDetails.runs,
                    fowFI: sc0.scoreDetails.wickets,
                    extrasDetailFI: sc0.extrasData?.total || 0,
                    titleSI: sc1.batTeamDetails?.batTeamName || "",
                    oversSI: sc1.scoreDetails?.overs || 0,
                    wicketsSI: sc1.scoreDetails?.wickets || 0,
                    runSI: sc1.scoreDetails?.runs || 0,
                    fowSI: sc1.scoreDetails?.wickets || 0,
                    extrasDetailSI: sc1.extrasData?.total || 0,
                    wicketsDataFI: convertWicketsData(sc0.wicketsData || {}),
                    wicketsDataSI: convertWicketsData(sc1.wicketsData || {})
                });

                const batting = [
                    ...Object.values(sc0.batTeamDetails.batsmenData || {}),
                    ...Object.values(sc1.batTeamDetails?.batsmenData || {})
                ];
                const bowling = [
                    ...Object.values(sc0.bowlTeamDetails.bowlersData || {}),
                    ...Object.values(sc1.bowlTeamDetails?.bowlersData || {})
                ];

                const updatePlayers = (players) => {
                    for (let p of players) {
                        const b = batting.find(b => b.batId == p.playerId);
                        if (b) {
                            p.runs = b.runs;
                            p.balls = b.balls;
                            p.fours = b.boundaries;
                            p.sixes = b.sixes;
                            p.strikeRate = b.strikeRate;
                            p.howOut = b.outDesc;
                        }

                        const bo = bowling.find(bw => bw.bowlerId == p.playerId);
                        if (bo) {
                            p.overs = bo.overs;
                            p.maidens = bo.maidens;
                            p.runsConceded = bo.runs;
                            p.wickets = bo.wickets;
                            p.economy = bo.economy;
                        }

                        p.points = pointCalculator(
                            p.runs || 0,
                            p.fours || 0,
                            p.sixes || 0,
                            p.strikeRate || 0,
                            p.wickets || 0,
                            p.economy || 0,
                            p.balls || 0
                        );
                    }
                };

                updatePlayers(existingLive.teamHomePlayers);
                updatePlayers(existingLive.teamAwayPlayers);

                matchLiveData.teamHomePlayers = existingLive.teamHomePlayers;
                matchLiveData.teamAwayPlayers = existingLive.teamAwayPlayers;
            }

            await MatchLive.updateOne({ matchId }, { $set: matchLiveData });
        } catch (err) {
            console.log(`Error for match ${matchId}:`, err.message);
        }
    }
};
