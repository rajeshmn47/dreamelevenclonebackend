const MatchLive = require("../models/matchlive");
const Player = require("../models/players");
var express = require("express");
const Withdraw = require("../models/withdraw");
const Match = require("../models/match");
const router = express.Router();

router.get("/allplayers", async (req, res) => {
    const players = await Player.find()
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/playerDetails/:id", async (req, res) => {
    const player = await Player.findOne({ id: parseInt(req.params.id) });
    let a = [{ teamAwayId: player?.teamId?.toString() }, { teamHomeId: player?.teamId?.toString() }]
    if (player) {
        console.log(player, 'player');
        let matches = [];
        for (let i = 0; i < player.teamIds.length; i++) {
            let w = await MatchLive.aggregate(
                [{ $match: { $or: [{ teamHomeId: player?.teamIds[i] }, { teamAwayId: player?.teamIds[i] }] } },
                {
                    $lookup: {
                        from: "matches",//your schema name from mongoDB
                        localField: "matchId", //user_id from user(main) model
                        foreignField: "matchId",//user_id from user(sub) model
                        as: "matchdetails"//result var name
                    }
                },]
            ).sort({ date: -1 })
            if (w.length > 0) {
                matches.push(...w)
            }
        }
        res.status(200).json({
            message: "player got successfully",
            player: player,
            matches: matches.sort((a, b) => b.date - a.date),
            length: matches?.length
        });
    }
    else {
        res.status(200).json({
            message: "player got successfully",
            player: player
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

module.exports = router;