const MatchLive = require("../models/matchlive");
const Player = require("../models/players");
var express = require("express");
const Withdraw = require("../models/withdraw");
const Match = require("../models/match");
const { getflag } = require("../utils/getflags");
const router = express.Router();
const flagURLs = require("country-flags-svg");
const { RemoveBgResult, RemoveBgError, removeBackgroundFromImageFile } = require("remove.bg");
const { removeBackgroundFromImageUrl } = require("remove.bg");
var fs = require('fs');
const { uploadImage } = require("../controllers/firebaseinitialize");
const { default: axios } = require("axios");

router.get("/allplayers", async (req, res) => {
    const directoryPath = './images/backgroundremovalneeded';

    // Get the list of files in the directory.
    const files = fs.readdirSync(directoryPath);

    // Count the number of files.
    const numberOfFiles = files.length;
    const players = await Player.find();
    res.status(200).json({
        message: "players got successfully",
        player: players,
        numberOfFiles: numberOfFiles
    });
});

router.get("/update-images", async (req, res) => {
    const players = await Player.find();
    const matches = await Match.find();
    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < matches?.length; j++) {
            let player = matches[j].teamHomePlayers?.find((team) => team.playerId == players[i]?.id)
            if (player) {
                console.log(player?.image, 'playeriidd');
                await Player.updateOne({ id: parseInt(player?.playerId) }, { image: player?.image })
                break;
            }
        }
        //await Player.updateOne({ id: players[i]?.id }, { image: player?.id })
    }
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/players-nobackground", async (req, res) => {
    // Get the current working directory
    const cwd = process.cwd();

    // Read the contents of the current working directory
    const files = fs.readdirSync('./images/nobackground');
    const morefiles = fs.readdirSync('./images/blank');
    // Loop through the files and print their names
    let existingImgs = []
    files.forEach(file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if (!(id == "img-removed-from-file")) {
            existingImgs.push(id)
        }
    });
    morefiles.forEach(file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if (!(id == "img-removed-from-file")) {
            existingImgs.push(id)
        }
    });

    const players = await Player.find({ id: { $nin: existingImgs } });
    for (let i = 0; i < players.length; i++) {
        const imageData = fs.readFileSync('images/blanke.png');
        fs.writeFile(`images/left/${players[i].id}.png`, imageData, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Image written successfully!');
            }
        });
    }
    res.status(200).json({
        message: "players got successfully",
        player: players
    });
});

router.get("/update-blankimage", async (req, res) => {
    // Get the current working directory
    const cwd = process.cwd();

    // Read the contents of the current working directory
    const files = fs.readdirSync('./images/existingimages');

    // Loop through the files and print their names
    let existingImgs = []
    files.forEach(async file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if ((!(id == "img-removed-from-file"))) {
            existingImgs.push(id);
        }
    });
    const players = await Player.find({ id: { $nin: existingImgs } });
    let nonexistingImgs = []
    for (let i = 0; i < players.length; i++) {
        const imageData = fs.readFileSync('images/left/blank.png');
        fs.writeFile(`images/nobackground/${players[i].id}.png`, imageData, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Image written successfully!');
            }
        });
        nonexistingImgs.push(players[i]?.id)
    }
    res.status(200).json({
        message: "players got successfully",
        player: players,
        nonexistingImgs: nonexistingImgs
    });
});

router.get("/upload-to-firebase", async (req, res) => {
    // Get the current working directory
    const cwd = process.cwd();
    // Read the contents of the current working directory
    const files = fs.readdirSync('./images/backgroundremoved');

    // Loop through the files and print their names
    let existingImgs = []
    files.forEach(async file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if ((!(id == "img-removed-from-file"))) {
            const a = await uploadImage(id)
            console.log(a, 'url')
        }
    });
    res.status(200).json({
        message: "uploaded images successfully",
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

router.get("/updatedatabase", (req, res) => {
    const files = fs.readdirSync('./images/backgroundremovalneeded');
    const newfiles = fs.readdirSync('./images/backgroundremoved');
    // Loop through the files and print their names
    let existingImgs = []
    files.forEach(file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if (!(id == "img-removed-from-file")) {
            existingImgs.push(id)
        }
    });
    newfiles.forEach(file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if (!(id == "img-removed-from-file")) {
            const index = existingImgs.indexOf(id);
            if (index > -1) { // only splice array when item is found
                existingImgs.splice(index, 1); // 2nd parameter means remove one item only
            }
        }
    });
    console.log(files?.length, 'total new files');
    Player.find({ id: { $in: existingImgs } }).then(players => {
        for (let i = 0; i < players.length; i++) {
            const x = 'https://www.cricbuzz.com/a/img/v1/152x152/i1/';
            const a = `c${players[i]?.image}/`;
            const b = `${players[i]?.name.split(' ').join('-').toLowerCase()}.jpg`;
            const url = x + a + b;
            const outputFile = `./images/backgroundremoved/${players[i]?.id}.png`;
            const localFile = `./images/backgroundremovalneeded/${players[i]?.id}.png`;
            removeBackgroundFromImageFile({
                path: localFile,
                apiKey: "PWMNVVjRR4MaRG5ayfoHmBRf",
                size: "regular",
                type: "auto",
                scale: "50%",
                outputFile
            }).then((result) => {
                console.log(`File saved to ${outputFile}`);
                const base64img = result.base64img;
            }).catch((errors) => {
                console.log(JSON.stringify(errors));
            });
        }
        function getData(player) {
            console.log(player, 'player');
            const x = 'https://www.cricbuzz.com/a/img/v1/152x152/i1/';
            const a = `c${player?.image}/`;
            const b = `${player?.name.split(' ').join('-').toLowerCase()}.jpg`;
            const url = x + a + b;
            const outputFile = `./images/nobackground/${player?.id}.png`;
            removeBackgroundFromImageUrl({
                url,
                apiKey: "LWvsxxt2uJBg3pQFxjUaNUfk",
                size: "regular",
                type: "person",
                outputFile
            }).then((result) => {
                console.log(`File saved to ${outputFile}`);
                const base64img = result.base64img;
            }).catch((errors) => {
                console.log(JSON.stringify(errors));
            });
        }
    }
    )
    try {
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

router.get("/withbackground-new", (req, res) => {
    const files = fs.readdirSync('./images/existingimages');

    // Loop through the files and print their names
    let existingImgs = []
    files.forEach(file => {
        console.log(file.split('.png')[0]);
        let id = file.split('.png')[0];
        if (!(id == "img-removed-from-file")) {
            existingImgs.push(id)
        }
    });
    Player.find({ id: { $nin: existingImgs } }).then(players => {
        for (let i = 0; i < players.length; i++) {
            console.log(players[i], 'player');
            const x = 'https://www.cricbuzz.com/a/img/v1/152x152/i1/';
            const a = `c${players[i]?.image}/`;
            const b = `${players[i]?.name.split(' ').join('-').toLowerCase()}.jpg`;
            const url = x + a + b;
            const outputFile = `./images/newwithbackground/${players[i]?.id}.png`;
            axios.get(url, { responseType: 'arraybuffer' }).then((response) => {
                let buffer = Buffer.from(response.data, 'base64')
                fs.writeFile(`images/newwithbackground/${players[i]?.id}.png`, buffer, (err) => {
                    if (err) throw err;
                    console.log('Image downloaded successfully!');
                });
            })
        }
    }
    )
    try {
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