const express = require("express");
const request = require("request");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const { getkeys } = require("../utils/crickeys");
const { isInPlay } = require("../utils/isInPlay");

const router = express.Router();

router.put("/update_match/:matchId", async (req, res) => {
    console.log(req.body, 'body');
    const matchId = req.params.matchId;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (match) {
        const { date, endDate, isInPlay, teamHomeName, teamAwayName } = req.body;
        await Match.updateOne({ matchId }, { date: date, endDate: endDate, teamHomeName: teamHomeName, teamAwayName: teamAwayName });
        await MatchLive.updateOne({ matchId }, { isInPlay: isInPlay });
        res.status(200).json({
            'team': 'team',
            message: "match edited successfully",
        });
    }
    else {
        res.status(400).json({
            messae: "failure",
            message: "cannot find team",
        });
    }
});

router.delete("/deletematch/:matchId", async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const match = await Match.deleteOne({ matchId: req.params.matchId });
        await MatchLive.deleteOne({ matchId });
        res.status(200).json({
            'team': 'team',
            message: "match edited successfully",
        });
    }
    catch {
        res.status(400).json({
            messae: "failure",
            message: "cannot find team",
        });
    }
});

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

router.get("/update_live_scores/:matchId", async (req, res) => {
    const matches = await Match.find({
        matchId: req.params.matchId
    });
    console.log(matches.length, 'dater')
    for (let i = 0; i < matches.length; i++) {
        console.log(matches[i].date, 'datee')
        const matchId = req.params.matchId;
        const match = await MatchLive.findOne({ matchId: matchId });
        if (!match || match?.result == "Complete") {
            res.status(200).json({
                message: "match is complete or in break,no need to update",
            });
        } else {
            const keys = await getkeys();
            console.log(matchId, 'jeys')
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

            const promise = new Promise((resolve, reject) => {
                request(options, (error, response, body) => {
                    if (error) {
                        console.log(error, 'error')
                        reject(error);
                    }
                    const s = JSON.parse(body);
                    resolve(s);
                });
            });

            // Use a closure to capture the current value of i
            (function (i) {
                promise
                    .then(async (s) => {
                        if (s.matchHeader != null && s.scoreCard != 0) {
                            const LiveMatchDet = new MatchLive();
                            LiveMatchDet.matchId = matchId;
                            LiveMatchDet.date = date1;
                            const inPlay = "Yes";
                            const { status } = s.matchHeader;
                            const toss = s.matchHeader.tossResults.tossWinnerName;
                            const result = s.matchHeader.state;
                            let isinplay = isInPlay(result, date1);
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
                            if (s.scoreCard.length > 0) {
                                batting1 = s.scoreCard[0].batTeamDetails.batsmenData;
                                bowling1 = s.scoreCard[0].bowlTeamDetails.bowlersData;
                                title_fi = s.scoreCard[0].batTeamDetails.batTeamName;
                                home_first =
                                    matches[i].teamHomeName.toLowerCase() ==
                                    s.scoreCard[0].batTeamDetails.batTeamName.toLowerCase();
                                overs_fi = s.scoreCard[0].scoreDetails.overs;
                                runs_fi = s.scoreCard[0].scoreDetails.runs;
                                wickets_fi = s.scoreCard[0].scoreDetails.wickets;
                                fow_fi = s.scoreCard[0].scoreDetails.wickets;
                                extrasDetails_fi = s.scoreCard[0].extrasData.total;
                            }
                            if (s.scoreCard.length > 1) {
                                batting2 = s.scoreCard[1].batTeamDetails.batsmenData;
                                bowling2 = s.scoreCard[1].bowlTeamDetails.bowlersData;
                                title_si = s.scoreCard[1].batTeamDetails.batTeamName;
                                overs_si = s.scoreCard[1].scoreDetails.overs;
                                runs_si = s.scoreCard[1].scoreDetails.runs;
                                wickets_si = s.scoreCard[1].scoreDetails.wickets;
                                fow_si = s.scoreCard[1].scoreDetails.wickets;
                                extrasDetails_si = s.scoreCard[1].extrasData.total;
                            }
                            const { teamHomePlayers } = match;
                            const { teamAwayPlayers } = match;
                            const batting = [];
                            const ke = Object.keys(batting1);
                            for (let j = 0; j < ke.length; j++) {
                                batting.push(batting1[ke[j]]);
                            }
                            const kf = Object.keys(batting2);
                            for (let j = 0; j < kf.length; j++) {
                                batting.push(batting2[kf[j]]);
                            }
                            const bowling = [];
                            const kg = Object.keys(bowling1);
                            for (let j = 0; j < kg.length; j++) {
                                bowling.push(bowling1[kg[j]]);
                            }
                            const kh = Object.keys(bowling2);
                            for (let j = 0; j < kh.length; j++) {
                                bowling.push(bowling2[kh[j]]);
                            }
                            for (let j = 0; j < teamHomePlayers.length; j++) {
                                const player = teamHomePlayers[j];
                                const { playerId } = player;
                                for (const batter of batting) {
                                    if (batter.batId == playerId) {
                                        teamHomePlayers[j].runs = batter.runs;
                                        teamHomePlayers[j].balls = batter.balls;
                                        teamHomePlayers[j].fours = batter.boundaries;
                                        teamHomePlayers[j].sixes = batter.sixes;
                                        teamHomePlayers[j].strikeRate = batter.strikeRate;
                                        teamHomePlayers[j].howOut = batter.outDesc;
                                        teamHomePlayers[j].batOrder = 0;
                                    }
                                }

                                for (const bowler of bowling) {
                                    const player = teamHomePlayers[j];
                                    const { playerId } = player;
                                    if (bowler.bowlerId == playerId) {
                                        teamHomePlayers[j].overs = bowler.overs;
                                        teamHomePlayers[j].maidens = bowler.maidens;
                                        teamHomePlayers[j].runsConceded = bowler.runs;
                                        teamHomePlayers[j].wickets = bowler.wickets;
                                        teamHomePlayers[j].economy = bowler.economy;
                                    }
                                }
                                teamHomePlayers[j].points = pointCalculator(
                                    teamHomePlayers[j].runs,
                                    teamHomePlayers[j].fours,
                                    teamHomePlayers[j].sixes,
                                    teamHomePlayers[j].strikeRate,
                                    teamHomePlayers[j].wickets,
                                    teamHomePlayers[j].economy,
                                    teamHomePlayers[j].balls
                                );
                            }
                            for (let j = 0; j < teamAwayPlayers.length; j++) {
                                const player = teamAwayPlayers[j];
                                const { playerId } = player;
                                for (const batter of batting) {
                                    if (batter.batId == playerId) {
                                        teamAwayPlayers[j].runs = batter.runs;
                                        teamAwayPlayers[j].balls = batter.balls;
                                        teamAwayPlayers[j].fours = batter.boundaries;
                                        teamAwayPlayers[j].sixes = batter.sixes;
                                        teamAwayPlayers[j].strikeRate = batter.strikeRate;
                                        teamAwayPlayers[j].howOut = batter.outDesc;
                                        teamAwayPlayers[j].batOrder = 0;
                                    }
                                }

                                for (const bowler of bowling) {
                                    const player = teamAwayPlayers[j];
                                    const { playerId } = player;
                                    if (bowler.bowlerId == playerId) {
                                        teamAwayPlayers[j].overs = bowler.overs;
                                        teamAwayPlayers[j].maidens = bowler.maidens;
                                        teamAwayPlayers[j].runsConceded = bowler.runs;
                                        teamAwayPlayers[j].wickets = bowler.wickets;
                                        teamAwayPlayers[j].economy = bowler.economy;
                                    }
                                }
                                teamAwayPlayers[j].points = pointCalculator(
                                    teamAwayPlayers[j].runs,
                                    teamAwayPlayers[j].fours,
                                    teamAwayPlayers[j].sixes,
                                    teamAwayPlayers[j].strikeRate,
                                    teamAwayPlayers[j].wickets,
                                    teamAwayPlayers[j].economy,
                                    teamAwayPlayers[j].balls
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
                                        },
                                    }
                                );
                                res.status(200).json({
                                    message: "updated live scores of the match successfully!",
                                });
                            } catch (err) {
                                console.log(`Error : ${err}`);
                                res.status(400).json({
                                    message: "error while updating live details of match",
                                });
                            }
                        }
                        else {
                            if (s?.matchHeader) {
                                const { status } = s?.matchHeader;
                                const toss = s.matchHeader.tossResults.tossWinnerName;
                                const result = s.matchHeader.state;
                                console.log(s.matchHeader.state, 'result')
                                let isinplay = isInPlay(result, matches[i].date);
                                const matchUpdate = await MatchLive.updateOne(
                                    { matchId },
                                    {
                                        $set: {
                                            isInPlay: isinplay,
                                            result: result
                                        }
                                    })
                                    res.status(200).json({
                                        message: "updated live scores of the match successfully!",
                                    });
                            }
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                        res.status(400).json({
                            message: "error while updating live details of match",
                        });
                    });
            })(i); // Pass the current value of i to the closure
        }
    }
});

router.get("/update_to_live/:matchId", async (req, res) => {
    try {
        const turing = await MatchLive();
        let date = new Date();
        const endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
        date = new Date(date.getTime() - 48 * 60 * 60 * 1000);
        const matches = await Match.find({
            matchId: req.params.matchId
        });
        console.log(matches.length, 'matches length')
        for (let i = 0; i < matches.length; i++) {
            const matchId = matches[i].matchId;
            const match = await MatchLive.findOne({ matchId: matchId });
            if (match) {
                console.log('exists');
                res.status(200).json({
                    message: "live details of the match exists!",
                });
            } else {
                const keys = await getkeys();
                console.log('not exists')
                const date1 = matches[i].date
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
                        const s = JSON.parse(body);
                        resolve(s);
                    });
                });
                promise
                    .then(async (s) => {
                        try {
                            console.log(s, 's')
                            if (s.matchInfo?.team1 != null && s.matchInfo?.team1.length != 0) {
                                const LiveMatchDet = new MatchLive();
                                LiveMatchDet.matchId = matchId;
                                LiveMatchDet.date = date1;
                                const r = [];
                                for (const x of s.matchInfo.team1.playerDetails) {
                                    if (x.role == "Unknown") {
                                        x.position = "Batsman";
                                    }
                                    const a = {
                                        playerId: x.id,
                                        playerName: x.name,
                                        image: x.faceImageId,
                                        points: 4,
                                        position: x.role,
                                        batOrder: -1,
                                    };
                                    r.push(a);
                                }
                                const y = [];
                                for (const x of s.matchInfo.team2.playerDetails) {
                                    if (x.role == "Unknown") {
                                        x.position = "Batsman";
                                    }
                                    const playerDet = {
                                        playerId: x.id,
                                        playerName: x.name,
                                        points: 4,
                                        image: x.faceImageId,
                                        position: x.role,
                                        batOrder: -1,
                                    };
                                    y.push(playerDet);
                                }
                                LiveMatchDet.teamHomePlayers = r;
                                LiveMatchDet.teamAwayPlayers = y;
                                LiveMatchDet.teamHomeId = s.matchInfo.team1.id;
                                LiveMatchDet.teamAwayId = s.matchInfo.team2.id;
                                LiveMatchDet.isInPlay = true;
                                const m = await MatchLive.findOne({ matchId });
                                const match = await MatchLive.create(LiveMatchDet);
                                if (match) {
                                    console.log(
                                        "Live Details of match is successfully added in db! "
                                    );
                                    res.status(200).json({
                                        message: "updated live details of match successfully",
                                    });
                                }
                            }
                        } catch (err) {
                            console.log(err);
                            res.status(400).json({
                                message: "error while updating live details of match",
                            });
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                        res.status(400).json({
                            message: "error while updating live details of match",
                        });
                    });
            }
        }
    }
    catch (error) {
        console.log(error)
    }
});

module.exports = router;
