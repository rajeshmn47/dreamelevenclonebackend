const MatchLive = require("../models/matchlive");
const Player = require("../models/players");
var express = require("express");
const Withdraw = require("../models/withdraw");
const Match = require("../models/match");
const { getflag } = require("../utils/getflags");
const router = express.Router();
const flagURLs = require("country-flags-svg");
const MatchLiveDetails = require("../models/matchlive");
const { setEngine } = require("crypto");
const DetailScores = require("../models/detailscores");

router.get("/allplayers", async (req, res) => {
    const players = await Player.find();
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/updatePlayers", async (req, res) => {
    const p = await Player.updateMany({}, { flagUrls: [] })
    const players = await Player.find();
    for (let i = 0; i < players?.length; i++) {
        try {
            for (let j = 0; j < players[i]?.teamIds.length; j++) {
                let home = await Match.findOne({ teamHomeId: players[i].teamIds[j] })
                let away = await Match.findOne({ teamAwayId: players[i].teamIds[j] })
                if (home) {
                    if (!players[i]?.flagUrls.includes(home.teamHomeFlagUrl)) {
                        players[i].flagUrls.push(home.teamHomeFlagUrl)
                    }
                }
                else if (away) {
                    if (!players[i]?.flagUrls.includes(away.teamAwayFlagUrl)) {
                        players[i].flagUrls.push(away?.teamAwayFlagUrl)
                    }
                }
            }
            await players[i].save()
        }
        catch (e) {
            console.log(e)
        }
    }
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/updateFlags", async (req, res) => {
    const m = await Match.updateMany({}, { teamAwayFlagUrl: "", teamHomeFlagUrl });
    const matches = await Match.find();
    for (let i = 0; i < matches?.length; i++) {
        try {
            let teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
                matches[i].teamAwayName
            );
            let teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
                matches[i].teamHomeName
            );
            if (!teamHomeFlagUrl) {
                matches[i].teamHomeFlagUrl = getflag(matches[i]?.teamHomeName);
            }
            else {
                matches[i].teamHomeFlagUrl = teamHomeFlagUrl;
            }
            if (!teamAwayFlagUrl) {
                matches[i].teamAwayFlagUrl = getflag(matches[i]?.teamAwayName);
            }
            else {
                matches[i].teamAwayFlagUrl = teamAwayFlagUrl;
            }
            await matches[i].save();
        }
        catch (e) {
            console.log(e)
        }
    }
    res.status(200).json({
        message: "matches flags updated successfully",
        player: matches
    });
});

router.get("/seriesDetails/:name", async (req, res) => {
    //const series = await Match.find({ matchTitle: req.params.name });
    let series = await Match.aggregate(
        [{ $match: { matchTitle: req.params.name, date: { $lt: new Date() }, } },
        {
            $lookup: {
                from: "matchlivedetails",//your schema name from mongoDB
                localField: "matchId", //user_id from user(main) model
                foreignField: "matchId",//user_id from user(sub) model
                as: "matchlive"//result var name
            }
        },]
    ).sort({ date: -1 });
    let topscorer;
    let allplayers = [];
    series.forEach((s) => {
        if (s.matchlive[0]?.teamAwayPlayers.length > 0 && s.matchlive[0]?.teamHomePlayers.length > 0) {
            s.matchlive[0].teamAwayPlayers?.forEach((p) => allplayers.push({ ...p, teamName: s.teamAwayName }))
            s.matchlive[0].teamHomePlayers?.forEach((p) => allplayers.push({ ...p, teamName: s.teamHomeName }))
        }
    }
    );
    sortingplayers = []
    allplayers.forEach((p) => {
        let player = allplayers.filter((pl) => pl.playerId == p.playerId)
        let runs = player.reduce((accumulator, currentValue) => accumulator + currentValue.runs,
            0);
        let wickets = player.reduce((accumulator, currentValue) => accumulator + currentValue.wickets,
            0);
        let sixes = player.reduce((accumulator, currentValue) => accumulator + currentValue.sixes,
            0);
        let fours = player.reduce((accumulator, currentValue) => accumulator + currentValue.fours,
            0);
        let totalMatches = player.filter((p) => p.balls > 0 || p.overs > 0).length
        let str = ((runs / (player.reduce((accumulator, currentValue) => accumulator + currentValue.balls,
            0))) * 100).toFixed(2);
        let strikeRate = isNaN(str) ? 0 : str;
        let average = isNaN((runs / totalMatches).toFixed(2)) ? 0 : ((runs / totalMatches).toFixed(2));
        let x = {
            player: { playerId: player[0].playerId, image: player[0]?.image, playerName: player[0].playerName },
            playerId: player[0].playerId, image: player[0]?.image, playerName: player[0].playerName, totalScore: runs,
            totalWickets: wickets, totalSixes: sixes, totalFours: fours, strikeRate: strikeRate,
            teamName: player[0].teamName, matches: totalMatches, average: average
        }
        if (!sortingplayers.find((s) => s.playerId == x.playerId)) {
            sortingplayers.push(x)
        }
    });
    try {
        res.status(200).json({
            message: "series details got successfully",
            series: series,
            sortedplayers: sortingplayers
        });
    }
    catch (e) {
        res.status(200).json({
            message: "series failed"
        });
    }
});

router.get("/pointsTable/:seriesName", async (req, res) => {
    //const series = await Match.find({ matchTitle: req.params.name });
    let matches = await Match.aggregate(
        [{ $match: { matchTitle: req.params.seriesName, date: { $lt: new Date() }, } },
        {
            $lookup: {
                from: "matchlivedetails",//your schema name from mongoDB
                localField: "matchId", //user_id from user(main) model
                foreignField: "matchId",//user_id from user(sub) model
                as: "matchlive"//result var name
            }
        },]
    ).sort({ date: -1 });
    console.log(matches.length, 'allmatches')
    let allteams = [];
    let allmatches = []
    const m = Array.from(new Set([...matches?.map((s) => ({ id: s?.teamHomeId, teamName: s.teamHomeName, matchdetails: s.matchlive[0] })), ...matches?.map((s) => ({ id: s?.teamAwayId, teamName: s.teamAwayName, matchdetails: s.matchlive[0] }))]));
    const uniquet = m.filter((f, x) => (m.indexOf(m.find((a) => a.id == f.id)) == x));
    uniquet.forEach((p) => {
        let homePlayed = matches.filter((pl) => (pl.matchlive[0].teamHomeId == p.id) && pl.matchlive[0].result == "Complete");
        let awayPlayed = matches.filter((pl) => (pl.matchlive[0].teamAwayId == p.id) && pl.matchlive[0].result == "Complete");
        console.log(awayPlayed?.length + homePlayed?.length, 'homeplayed');
        let fiwon = matches.filter((ma) => ma.matchlive[0].runSI < ma.matchlive[0].runFI);
        let siwon = matches.filter((ma) => ma.matchlive[0].runSI > ma.matchlive[0].runFI);
        let won = 0;
        let lost = 0;
        let points = 0;
        let s = ''
        matches.forEach((mat) => {
            if (mat.matchlive[0].result == "Complete") {
                if (mat.matchlive[0].isHomeFirst) {
                    if (p.id == mat.matchlive[0].teamHomeId) {
                        if (mat.matchlive[0].runFI > mat.matchlive[0].runSI) {
                            won = won + 1
                            points = points + 2
                            s = s + 'w'
                        }
                        else {
                            lost = lost + 1
                            s = s + 'l'
                        }
                    }
                    else if (p.id == mat.matchlive[0].teamAwayId) {
                        if (mat.matchlive[0].runFI < mat.matchlive[0].runSI) {
                            won = won + 1
                            points = points + 2
                            s = s + 'w'
                        }
                        else {
                            lost = lost + 1
                            s = s + 'l'
                        }
                    }
                }
                else {
                    if (p.id == mat.matchlive[0].teamHomeId) {
                        if (mat.matchlive[0].runSI > mat.matchlive[0].runFI) {
                            won = won + 1
                            points = points + 2
                            s = s + 'w'
                        }
                        else {
                            lost = lost + 1
                            s = s + 'l'
                        }
                    }
                    if (p.id == mat.matchlive[0].teamAwayId) {
                        if (mat.matchlive[0].runSI < mat.matchlive[0].runFI) {
                            won = won + 1
                            points = points + 2
                            s = s + 'w'
                        }
                        else {
                            lost = lost + 1
                            s = s + 'l'
                        }
                    }
                }
            }
        })
        let played = homePlayed?.length + awayPlayed?.length;
        let singleteam = { teamName: p.teamName, id: p.id, won: won, lost: lost, played: played, points: points, form: s }
        allteams.push(singleteam)
    });
    //console.log(uniqueteams, 'uniqueteams');
    try {
        res.status(200).json({
            message: "series details got successfully",
            allteams: allteams
        });
    }
    catch (e) {
        res.status(200).json({
            message: "series failed"
        });
    }
});

router.get("/updatedatabase", async (req, res) => {
    try {
        const allmatches = await MatchLive.find();
        console.log(allmatches?.length, 'lengthe')
        for (let i = 0; i < allmatches?.length; i++) {
            for (let k = 0; k < allmatches[i]?.teamAwayPlayers?.length; + k++) {
                await Player.create({
                    name: allmatches[i].teamAwayPlayers[k].playerName,
                    id: allmatches[i].teamAwayPlayers[k].playerId,
                    image: allmatches[i].teamAwayPlayers[k].image,
                    teamId: allmatches[i].teamAwayId
                })
            }
            for (let k = 0; k < allmatches[i]?.teamHomePlayers?.length; + k++) {
                await Player.create({
                    name: allmatches[i].teamHomePlayers[k].playerName,
                    id: allmatches[i].teamHomePlayers[k].playerId,
                    image: allmatches[i].teamHomePlayers[k].image,
                    teamId: allmatches[i].teamHomeId
                })
            }
        }
        res.status(200).json({
            message: "players added successfully",
        });
    }
    catch (e) {
        console.log(e);
        res.status(400).json({
            message: e,
        });
    }
});

router.get("/match-details", async (req, res) => {
    const allmatches = await DetailScores.find();
    console.log(allmatches?.length, 'allmatches')
    try {
        let overs = await DetailScores.find();
        res.status(200).json({
            message: "players added successfully",
            overs: overs
        });
    }
    catch (e) {
        //console.log(e);
        res.status(400).json({
            message: e,
        });
    }
});

router.get("/match-details/:matchId", async (req, res) => {
    const match = await DetailScores.findOne({ matchId: req.params.matchId });
    console.log(match,req.params.matchId, 'allmatches')
    try {
        res.status(200).json({
            message: "players added successfully",
            match: match
        });
    }
    catch (e) {
        //console.log(e);
        res.status(400).json({
            message: e,
        });
    }
});

module.exports = router;