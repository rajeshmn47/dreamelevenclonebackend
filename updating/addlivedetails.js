const request = require("request");
const Match = require("../models/match");
const MatchLiveDetails = require("../models/matchlive");
const { getkeys, squadkeys } = require("../utils/apikeys");
const { messaging } = require("../utils/firebaseinitialize");
const { sendTweet } = require("../utils/sendTweet");

const sendNotification = async (title, body, topic = "live-updates") => {
  const message = {
    notification: {
      title,
      body,
    },
    topic, // Replace with a specific topic or use tokens for individual devices
  };

  try {
    const response = await messaging.send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

function generateMatchHashtags(team1, team2, seriesName) {
  const baseTag = `#${team1.replace(/\s/g, '')}Vs${team2.replace(/\s/g, '')}`;
  const tags = [baseTag, '#Cricket'];

  const leagueMap = {
    'indian premier league': ['#IPL', '#IPL2025'],
    'pakistan super league': ['#PSL', '#PSL2025'],
    'big bash league': ['#BBL', '#BBL2025'],
    'caribbean premier league': ['#CPL', '#CPL2025'],
    'the hundred': ['#TheHundred', '#TheHundred2025']
    // Add more as needed
  };

  const normalizedSeries = seriesName?.toLowerCase();

  for (const [league, hashtags] of Object.entries(leagueMap)) {
    if (normalizedSeries.includes(league)) {
      tags.push(...hashtags);
      break;
    }
  }

  return tags.join(' ');
}

async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      }
      if (body) {
        const s = JSON.parse(body);
        resolve(s);
      }
      else {
        resolve(null);
      }
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.addLiveDetails = async function () {
  try {
    const matches = await Match.find({
      date: { $gte: new Date(Date.now() - 10 * 60 * 60 * 1000), $lt: new Date(Date.now() + 0.5 * 60 * 60 * 1000) },
    });
    console.log(matches?.length, 'matchest')

    for (let match of matches) {
      const matchExists = await MatchLiveDetails.findOne({ matchId: match.matchId });
      if (matchExists) continue;

      const keys = await squadkeys();
      console.log(keys, 'keys')
      const options = {
        method: "GET",
        url: `https://cricbuzz-cricket2.p.rapidapi.com/mcenter/v1/${match.matchId}/teams`,
        headers: {
          "x-rapidapi-host": "cricbuzz-cricket2.p.rapidapi.com",
          "x-rapidapi-key": keys
        },
      };

      console.log(keys, 'keyss')

      let success = false;
      while (!success) {
        try {
          await delay(1000);
          const data = await makeRequest(options); // this will contain only players
          console.log(data, 'data for players')
          players1 = data.team1.players["playing XI"] || data.team1.players["Squad"]
          players2 = data.team2.players["playing XI"] || data.team2.players["Squad"]
          const team1Players = players1.map(p => ({
            playerId: p.id,
            playerName: p.name,
            image: p.faceImageId,
            points: 4,
            position: p.role === "Unknown" ? "Batsman" : p.role,
            batOrder: -1
          }));

          const team2Players = players2.map(p => ({
            playerId: p.id,
            playerName: p.name,
            image: p.faceImageId,
            points: 4,
            position: p.role === "Unknown" ? "Batsman" : p.role,
            batOrder: -1
          }));

          const liveMatch = new MatchLiveDetails({
            matchId: match.matchId,
            date: match.date,
            teamHomeId: match.teamHomeId,
            teamAwayId: match.teamAwayId,
            teamHomePlayers: team1Players,
            teamAwayPlayers: team2Players,
            isInPlay: true
          });

          await liveMatch.save();

          // Send notification / tweet
          if (match?.important) {
            await sendNotification(
              `Lineups Out: ${match.teamHomeName} vs ${match.teamAwayName}`,
              `The lineups for ${match.teamHomeName} and ${match.teamAwayName} are now available.`
            );
            await sendTweet(
              `Lineups Out: ${match.teamHomeName} vs ${match.teamAwayName}\nThe lineups for ${match.teamHomeName} and ${match.teamAwayName} are now available. Check out the details!
              https://www.cricbuzz.com/live-cricket-scores/${match?.matchId} \n${generateMatchHashtags(match.teamHomeCode, match.teamAwayCode, match.matchTitle)}`
            );
          }

          success = true;
        } catch (err) {
          if (err.message.includes("rate limit")) {
            console.log("Rate limit hit, retrying...");
            await delay(1000);
          } else {
            console.log(err);
            success = true;
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
