const express = require("express");
const request = require("request");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const { getkeys } = require("../utils/crickeys");
const { isInPlay } = require("../utils/isInPlay");
const Series = require("../models/series");
const Squad = require("../models/squad");
const CricketTeam = require("../models/cricketteam");
const ContestType = require("../models/contestType");
const Contest = require("../models/contest");
const router = express.Router();
const { getflag } = require("../utils/getflags");
const flagURLs = require("country-flags-svg");

function convertWicketsData(wicketsData) {
    return Object.keys(wicketsData).map(key => wicketsData[key]);
}

router.post("/create", async (req, res) => {
    try {
        const {
            matchId,
            matchTitle,
            seriesId,
            teamHomeName,
            teamAwayName,
            teamHomeCode,
            teamAwayCode,
            teamHomeId,
            teamAwayId,
            date,
            endDate: enddate,
            format,
            type,
        } = req.body;

        teamAwayFlagUrl = flagURLs?.findFlagUrlByCountryName(
            teamAwayName
        );
        teamHomeFlagUrl = flagURLs?.findFlagUrlByCountryName(
            teamHomeName
        );
        if (!teamAwayFlagUrl) {
            teamAwayFlagUrl = getflag(teamAwayName);
        }
        if (!teamHomeFlagUrl) {
            teamHomeFlagUrl = getflag(teamHomeName);
        }
        teamHomeFlagUrl = teamHomeFlagUrl ? teamHomeFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";
        teamAwayFlagUrl = teamAwayFlagUrl ? teamAwayFlagUrl : "https://via.placeholder.com/150?text=Team+Logo+Unavailable";


        // Check for existing match
        const existingMatch = await Match.findOne({ matchId });
        if (existingMatch) {
            return res.status(400).json({ message: "Match already exists" });
        }

        // Create Match
        const contestId = [];
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
                    contestId.push(contest2._id);
                }
            } catch (err) {
                console.log(`Error : ${err}`);
            }
        }
        await Match.create({
            matchId,
            matchTitle,
            seriesId,
            teamHomeName,
            teamAwayName,
            teamHomeCode,
            teamAwayCode,
            teamHomeId,
            teamAwayId,
            teamHomeFlagUrl,
            teamAwayFlagUrl,
            date,
            enddate: enddate, // Make sure your model uses 'endDate' not 'enddate'
            format,
            type,
            contestId: contestId
        });
        res.status(201).json({ message: "Match created successfully" });
    } catch (err) {
        console.error("Error creating match:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put("/update_match/:matchId", async (req, res) => {
    console.log(req.body, 'body');
    const matchId = req.params.matchId;
    const {
        matchTitle,
        seriesId,
        teamHomeName,
        teamAwayName,
        teamHomeCode,
        teamAwayCode,
        teamHomeId,
        teamAwayId,
        teamHomeFlagUrl,
        teamAwayFlagUrl,
        date,
        enddate,
        format,
        type,
    } = req.body;
    const match = await Match.findOne({ matchId: req.params.matchId });
    if (match) {
        const { isInPlay, runsFI, runsSI } = req.body;
        await Match.updateOne({ matchId }, {
            matchTitle,
            seriesId,
            teamHomeName,
            teamAwayName,
            teamHomeCode,
            teamAwayCode,
            teamHomeId,
            teamAwayId,
            teamHomeFlagUrl,
            teamAwayFlagUrl,
            date,
            enddate,
            format,
            type,
        });
        await MatchLive.updateOne({ matchId }, { isInPlay: isInPlay, runsFI: runsFI, runsSI: runsSI });
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

router.get("/series/all", async (req, res) => {
    try {
        const series = await Series.find({});
        res.status(200).json(series);
    } catch (error) {
        res.status(500).json({ message: "Error fetching series", error });
    }
});

// Create new series
router.post("/series/create", async (req, res) => {
    try {
        const { seriesId, name, type, date, startDate, endDate } = req.body;

        const existing = await Series.findOne({ seriesId });
        if (existing) {
            return res.status(400).json({ message: "Series with this ID already exists" });
        }

        const newSeries = new Series({
            seriesId,
            name,
            type,
            date,
            startDate,
            endDate,
        });

        await newSeries.save();

        res.status(201).json({ message: "Series created successfully", series: newSeries });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create series", error: err.message });
    }
});

router.put("/series/:seriesId", async (req, res) => {
    try {
        const { seriesId } = req.params;
        const { name, type, date, startDate, endDate } = req.body;

        const updatedSeries = await Series.findOneAndUpdate(
            { seriesId: Number(seriesId) }, // find by seriesId
            { name, type, date, startDate, endDate },
            { new: true, runValidators: true }
        );

        if (!updatedSeries) {
            return res.status(404).json({ message: "Series not found" });
        }

        res.json({ message: "Series updated successfully", series: updatedSeries });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update series", error: err.message });
    }
});

// Fetch all squads
router.get("/squads", async (req, res) => {
    try {
        const squads = await Squad.find();
        res.json(squads);
    } catch (err) {
        console.error("Fetch Squads Error:", err);
        res.status(500).json({ message: "Failed to fetch squads" });
    }
});



router.post("/squad/create", async (req, res) => {
    try {
        const { squadId, teamId, teamName, seriesId, players } = req.body;

        if (!squadId || !teamId || !seriesId || !teamName || !Array.isArray(players)) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const existing = await Squad.findOne({ squadId, teamId, seriesId });
        let players_list = players.map((player) => { return { ...player, playerId: player.id, playerName: player.name } })
        if (existing) {
            // Update
            existing.players = players;
            existing.teamName = teamName;
            await existing.save();
            return res.status(200).json({ message: "Squad updated", squad: existing });
        } else {
            // Create
            const newSquad = new Squad({
                squadId,
                teamId,
                teamName,
                seriesId,
                players: players_list
            });

            await newSquad.save();
            return res.status(201).json({ message: "Squad created", squad: newSquad });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create squad", error: err.message });
    }
});

// Update Squad
router.put("/squads/:id", async (req, res) => {
    try {
        const squadId = req.params.id;
        const { teamId, squadId: newSquadId, seriesId, teamName, players } = req.body;

        const updated = await Squad.findByIdAndUpdate(
            squadId,
            { teamId, squadId: newSquadId, seriesId, teamName, players },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Squad not found" });
        }

        res.json({ message: "Squad updated successfully", squad: updated });
    } catch (err) {
        console.error("Update Squad Error:", err);
        res.status(500).json({ message: "Failed to update squad", error: err.message });
    }
});

// Delete Squad
router.delete("/squads/:id", async (req, res) => {
    try {
        const deleted = await Squad.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Squad not found" });
        }

        res.json({ message: "Squad deleted successfully" });
    } catch (err) {
        console.error("Delete Squad Error:", err);
        res.status(500).json({ message: "Failed to delete squad" });
    }
});

router.post("/team/create", async (req, res) => {
    try {
        const team = await CricketTeam.create(req.body);
        res.status(201).json(team);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/teams - Get all teams
router.get("/team/all", async (req, res) => {
    try {
        const teams = await CricketTeam.find();
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/teams/:id - Get one team by MongoDB ID
router.get("/team/:id", async (req, res) => {
    try {
        const team = await CricketTeam.findById(req.params.id);
        if (!team) return res.status(404).json({ error: "Team not found" });
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/teams/:id - Update a team
router.put("/team/:id", async (req, res) => {
    try {
        const updated = await CricketTeam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Team not found" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/teams/:id - Delete a team
router.delete("/team/:id", async (req, res) => {
    try {
        const deleted = await CricketTeam.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Team not found" });
        res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

router.get("/update_live_scoress/:matchId", async (req, res) => {
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

router.get("/update_to_lives/:matchId", async (req, res) => {
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

router.get("/livescore/:matchId", async (req, res) => {
    const { matchId } = req.params;

    try {
        const match = await Match.findOne({ matchId });
        const matchLive = await MatchLive.findOne({ matchId });

        if (!match || !matchLive) {
            return res.status(404).json({ error: "Match not found in database" });
        }

        const response = {
            matchId,
            status: matchLive.result || "N/A",
            toss: matchLive.toss || "N/A",
            result: matchLive.result || "N/A",
            titleFI: matchLive.titleFI || "",
            oversFI: matchLive.oversFI || 0,
            runFI: matchLive.runFI || 0,
            wicketsFI: matchLive.wicketsFI || 0,
            extrasDetailFI: matchLive.extrasDetailFI || 0,
            titleSI: matchLive.titleSI || "",
            oversSI: matchLive.oversSI || 0,
            runSI: matchLive.runSI || 0,
            wicketsSI: matchLive.wicketsSI || 0,
            extrasDetailSI: matchLive.extrasDetailSI || 0,
            teamHomePlayers: matchLive.teamHomePlayers || [],
            teamAwayPlayers: matchLive.teamAwayPlayers || []
        };

        res.json(response);
    } catch (error) {
        console.error("Error fetching live score:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/live-scores/:matchId", async (req, res) => {
    const { matchId } = req.params;

    try {
        const match = await Match.findOne({ matchId });
        const live = await MatchLive.findOne({ matchId });

        if (!match || !live) {
            return res.status(404).json({ message: "Match data not found." });
        }

        // Build mock scoreCard & matchHeader structure expected by addLivescoresDetailsCustom
        const scoreCard = [];

        const makeScoreCardEntry = (teamPlayers, run, wickets, overs, extras, teamName, bowlers = [], batsmen = [], wicketsData = {}) => ({
            batTeamDetails: {
                batTeamName: teamName,
                batsmenData: Object.fromEntries(
                    batsmen.map(p => [p.playerId, {
                        batId: p.playerId,
                        runs: p.runs || 0,
                        balls: p.balls || 0,
                        boundaries: p.fours || 0,
                        sixes: p.sixes || 0,
                        strikeRate: p.strikeRate || 0,
                        outDesc: p.howOut || "",
                    }])
                )
            },
            bowlTeamDetails: {
                bowlersData: Object.fromEntries(
                    bowlers.map(p => [p.playerId, {
                        bowlerId: p.playerId,
                        overs: p.overs || 0,
                        maidens: p.maidens || 0,
                        runs: p.runsConceded || 0,
                        wickets: p.wickets || 0,
                        economy: p.economy || 0,
                    }])
                )
            },
            scoreDetails: {
                runs: run || 0,
                wickets: wickets || 0,
                overs: overs || 0
            },
            extrasData: {
                total: extras || 0
            },
            wicketsData
        });

        if (live.titleFI) {
            const batsmenFI = live.teamHomePlayers.concat(live.teamAwayPlayers).filter(p => p.runs || p.balls);
            const bowlersFI = live.teamHomePlayers.concat(live.teamAwayPlayers).filter(p => p.wickets);
            scoreCard.push(makeScoreCardEntry([], live.runFI, live.wicketsFI, live.oversFI, live.extrasDetailFI, live.titleFI, bowlersFI, batsmenFI));
        }

        if (live.titleSI) {
            const batsmenSI = live.teamHomePlayers.concat(live.teamAwayPlayers).filter(p => p.runs || p.balls);
            const bowlersSI = live.teamHomePlayers.concat(live.teamAwayPlayers).filter(p => p.wickets);
            scoreCard.push(makeScoreCardEntry([], live.runSI, live.wicketsSI, live.oversSI, live.extrasDetailSI, live.titleSI, bowlersSI, batsmenSI));
        }

        const matchHeader = {
            status: live.status,
            tossResults: {
                tossWinnerName: live.toss
            },
            state: live.result
        };

        return res.json({
            scoreCard,
            matchHeader
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error." });
    }
});

router.get("/live-status/:matchId", async (req, res) => {
    const { matchId } = req.params;

    try {
        const matchLive = await MatchLive.findOne({ matchId });
        if (!matchLive) {
            return res.status(404).json({ message: "Match live data not found." });
        }
        const response = {
            matchId: matchLive.matchId,
            inPlay: matchLive.inPlay,
            status: matchLive.status,
            toss: matchLive.toss,
            result: matchLive.result,
            isInPlay: matchLive.isInPlay
        };
        res.json(response);
    } catch (error) {
        console.error("Error fetching live status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
)

router.get("/live-details/:matchId", async (req, res) => {
    const { matchId } = req.params;

    try {
        const match = await Match.findOne({ matchId });
        const matchLive = await MatchLive.findOne({ matchId });

        if (!match || !matchLive) {
            return res.status(404).json({ message: "Match or live data not found." });
        }

        res.json({
            matchId: match.matchId,
            matchTitle: match.matchTitle,
            seriesId: match.seriesId,
            teamHomeName: match.teamHomeName,
            teamAwayName: match.teamAwayName,
            teamHomeCode: match.teamHomeCode,
            teamAwayCode: match.teamAwayCode,
            teamHomeId: match.teamHomeId,
            teamAwayId: match.teamAwayId,
            teamHomeFlagUrl: match.teamHomeFlagUrl,
            teamAwayFlagUrl: match.teamAwayFlagUrl,
            date: match.date,
            enddate: match.enddate,
            format: match.format,
            type: match.type,
            contestId: match.contestId,
            // Live details
            inPlay: matchLive.inPlay,
            status: matchLive.status,
            toss: matchLive.toss,
            result: matchLive.result,
            isInPlay: matchLive.isInPlay,
            teamHomePlayers: matchLive.teamHomePlayers,
            teamAwayPlayers: matchLive.teamAwayPlayers,
            titleFI: matchLive.titleFI,
            oversFI: matchLive.oversFI,
            runFI: matchLive.runFI,
            wicketsFI: matchLive.wicketsFI,
            extrasDetailFI: matchLive.extrasDetailFI,
            titleSI: matchLive.titleSI,
            oversSI: matchLive.oversSI,
            runSI: matchLive.runSI,
            wicketsSI: matchLive.wicketsSI,
            extrasDetailSI: matchLive.extrasDetailSI,
        });
    } catch (error) {
        console.error("Error fetching live details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all matches for a specific series
router.get("/series/:seriesId/matches", async (req, res) => {
    try {
        const { seriesId } = req.params;
        // Find all matches with this seriesId
        const matches = await Match.find({ seriesId: String(seriesId) });
        res.status(200).json(matches);
    } catch (err) {
        console.error("Error fetching matches for series:", err);
        res.status(500).json({ message: "Failed to fetch matches for series", error: err.message });
    }
});

router.get("/update_live_scores/:matchId", async (req, res) => {
    const matches = await Match.find({
        matchId: req.params.matchId
    });
    const isSource = process.env.SOURCE
    const URL = process.env.BACKEND_URL;
    if (isSource == "true") {
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
                    url: "https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/hscard",
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
                                    console.log('Error : ${ err }');
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
    }
    else {
        const matches = await Match.find({
            matchId: req.params.matchId
        });
        console.log(matches?.length, 'matchest')
        for (const matchDoc of matches) {
            const { matchId, date } = matchDoc;
            const existingLive = await MatchLive.findOne({ matchId });
            if ((!existingLive || existingLive.result === "Complete" || !existingLive.isInPlay)) {
                console.log('Match ${matchId} is not in play or already completed.');
                continue;
            }
            const apiUrl = `${URL}/api/match/live-scores/${matchId}`;

            try {
                const result = await fetch(apiUrl, {
                    headers: {
                        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
                        "X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
                        "servertoken": process.env.SERVER_TOKEN,
                        useQueryString: true,
                    },
                });
                const s = await result.json();
                //console.log(s, 's')
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
                res.status(200).json({
                    message: "updated live scores of the match successfully!",
                });
            } catch (err) {
                console.log(`Error for match ${matchId}:, ${err.message}`);
                console.log(err)
                res.status(400).json({
                    message: "error while updating live details of match",
                });
            }
        }
    }
});

router.get("/update_to_live/:matchId", async (req, res) => {
    const isSource = process.env.SOURCE
    const URL = process.env.BACKEND_URL;
    if (isSource == "true") {
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
    }
    else {
        try {
            const turing = await MatchLive();
            let date = new Date();
            const endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
            date = new Date(date.getTime() - 48 * 60 * 60 * 1000);
            const matches = await Match.find({
                matchId: req.params.matchId
            });
            console.log(matches.length, 'matches lengthy')
            for (let i = 0; i < matches.length; i++) {
                const matchId = matches[i].matchId;
                const match = await MatchLive.findOne({ matchId: matchId });
                if (match) {
                    console.log('exists');
                    res.status(200).json({
                        message: "live details of the match exists!",
                    });
                } else {
                    console.log('not exists')
                    const date1 = matches[i].date
                    const options = {
                        method: "GET",
                        //url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}`,
                        url: `${URL}/api/match/live-details/${matchId}`,
                        headers: {
                            "servertoken": process.env.SERVER_TOKEN, // if you use server token for auth
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
                                if (s?.teamAwayId != null && s?.teamAwayId != undefined && s?.teamHomeId != null && s?.teamHomeId != undefined) {
                                    const LiveMatchDet = new MatchLive();
                                    LiveMatchDet.matchId = matchId;
                                    LiveMatchDet.date = date1;
                                    LiveMatchDet.teamHomePlayers = s.teamHomePlayers;
                                    LiveMatchDet.teamAwayPlayers = s.teamAwayPlayers;
                                    LiveMatchDet.teamHomeId = s.teamHomeId;
                                    LiveMatchDet.teamAwayId = s.teamAwayId;
                                    LiveMatchDet.isInPlay = true;
                                    const m_k = await MatchLive.findOne({ matchId });
                                    const matchlive = await MatchLive.create(LiveMatchDet);
                                    if (matchlive) {
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
    }
});

module.exports = router;
