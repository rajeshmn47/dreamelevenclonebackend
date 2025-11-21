const path = require('path');
const fs = require('fs');
const MatchLiveDetails = require("../models/matchlive");
const Matches = require("../models/match");
const Squad = require("../models/squad");
const { getkeys } = require("../utils/crickeys");
const db = require("../utils/firebaseinitialize");
const DetailScores = require("../models/detailscores");
const { fuzzyMatchVideo } = require("../utils/fuzzyMatchVideos");
const { findBestMatchingOver } = require("../utils/stringSimilar");
const Series = require('../models/series');
const { default: axios } = require('axios');

const oversJsonPath = path.join(__dirname, './../overs_with_clips.json');
const data = JSON.parse(fs.readFileSync(oversJsonPath, 'utf-8'));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.updateSquads = async function () {
    try {
        const now = Date.now();
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

        console.log(ongoingSeries, `Found ${ongoingSeries.length} ongoing series`);

        for (const series of ongoingSeries) {
            const seriesId = series.seriesId;
            const key = await getkeys('123456')
            const options = {
                method: 'GET',
                hostname: 'cricbuzz-cricket.p.rapidapi.com',
                url: `https://cricbuzz-cricket.p.rapidapi.com/series/v1/${seriesId}/squads`,
                headers: {
                    'x-rapidapi-key': key,
                    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
                }
            };

            try {
                const response = await axios.request(options)
                delay(1000); // 1 second delay between requests
                const squads = response?.data?.squads || [];

                for (const team of squads) {

                    const { teamId, squadId } = team;
                    const teamName = team?.squadType
                    if (!squadId) {
                        console.warn(`No squadId found for team ${teamName}`);
                        continue;
                    }

                    const teamUrl = `https://m.cricbuzz.com/api/cricket-series/series-squads/${seriesId}/${squadId}`;

                    try {
                        const response = await fetch(teamUrl);
                        const squadDetails = await response.json();
                        let squad = squadDetails.player.filter((player) => !player.isHeader).map((player) => {
                            return {
                                playerId: player.id,
                                playerName: player.name,
                                position: player.role,
                                image: player.imageId
                            }
                        }
                        );
                        console.log(squad, 'squad')
                        const players = squad || [];

                        await Squad.findOneAndUpdate(
                            { seriesId, teamId },
                            {
                                seriesId,
                                teamId,
                                squadId,
                                teamName,
                                players
                            },
                            { upsert: true, new: true }
                        );

                        console.log(`✅ Saved squad for ${teamName} in series ${seriesId}`);
                    }
                    catch (err) {
                        console.error(`❌ Failed fetching squad from ${teamUrl}:`, err);
                    }
                }
            } catch (err) {
                console.error(`❌ Failed to parse response for series ${seriesId}:`, err);
            }
        }
    } catch (err) {
        console.error('Error in updateSquads:', err);
    }
};
