const mongoose = require("mongoose");
const CricketTeam = require("../models/cricketteam");
const fetch = require("node-fetch");
const { getkeys } = require("../utils/crickeys");
require("dotenv").config();

async function fetchAndSaveTeams() {
    //await CricketTeam.collection.drop();
    //await CricketTeam.deleteMany({}); // Clear existing international teams
    const RAPIDAPI_KEY = await getkeys('12345') // Put your RapidAPI key in .env
    const cricketteams = await CricketTeam.find({});
    console.log(cricketteams, 'cricketteams')
    const url = "https://cricbuzz-cricket.p.rapidapi.com/teams/v1/domestic";
    const options = {
        method: "GET",
        headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com"
        }
    };

    const response = await fetch(url, options);
    const teamsData = await response.json();
    console.log(teamsData, 'teamsData')
    const data = teamsData.list;

    for (const team of data) {
        if (team?.teamId) {
            await CricketTeam.findOneAndUpdate(
                { id: team.teamId },
                {
                    id: team.teamId,
                    teamName: team.teamName,
                    shortName: team.teamSName,
                    image: team.imageId,
                    type: "international"
                },
                { upsert: true, new: true }
            );
            console.log(`Upserted team: ${team.teamName} (${team.teamId})`);
        }
    }
}

module.exports = { fetchAndSaveTeams };
