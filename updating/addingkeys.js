const RapidApiKey = require("../models/rapidapikeys");

module.exports.addingkeys = async function () {
    keys = process.env.apikeys
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/ /g, "")
        .split(",");
    console.log(keys);
    for (let i = 0; i < keys.length; i++) {
        await RapidApiKey.findOneAndUpdate(
            { apiKey: keys[i] },
            { $set: { type: 'matches' } },
            { upsert: true, new: true }
        );
    }
    keys = process.env.crickeys
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/ /g, "")
        .split(",");
    console.log(keys);
    for (let i = 0; i < keys.length; i++) {
        await RapidApiKey.findOneAndUpdate(
            { apiKey: keys[i] },
            { $set: { type: 'scores' } },
            { upsert: true, new: true }
        );
    }
    keys = process.env.squadkeys
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/ /g, "")
        .split(",");
    console.log(keys);
    for (let i = 0; i < keys.length; i++) {
        await RapidApiKey.findOneAndUpdate(
            { apiKey: keys[i] },
            { $set: { type: 'lineups' } },
            { upsert: true, new: true }
        );
    }
}

