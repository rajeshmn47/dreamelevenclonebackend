const mongoose = require("mongoose");
const CricketTeam = require("../models/cricketteam");
const fetch = require("node-fetch");
const { getkeys } = require("../utils/crickeys");
require("dotenv").config();

async function fetchAndSaveTeams() {
    //await CricketTeam.collection.drop();
    //await CricketTeam.deleteMany({}); // Clear existing international teams
    const RAPIDAPI_KEY = await getkeys() // Put your RapidAPI key in .env
    const cricketteams= await CricketTeam.find({});
    console.log(cricketteams,'cricketteams')
    const url = "https://cricbuzz-cricket.p.rapidapi.com/teams/v1/international";
    const options = {
        method: "GET",
        headers: {
            "X-RapidAPI-Key": "77cac70752msh1ce13ec8cd5c240p1160fbjsn5e68d56cf5a5",
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
