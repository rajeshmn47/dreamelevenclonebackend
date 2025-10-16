const request = require("request");
const Match = require("../models/match");
const MatchLiveDetails = require("../models/matchlive");
const { getkeys, squadkeys } = require("../utils/apikeys");
const { messaging } = require("../utils/firebaseinitialize");
const { sendTweet, sendTweetWithImage, sendTweetWithPoll } = require("../utils/sendTweet");
const { createVsImage } = require("../utils/generateTweetImage");
const RapidApiKey = require("../models/rapidapikeys");

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
  const tags = [baseTag, '#Cricket', '#asiacup2025'];

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
        resolve({ ...s, headers: response.headers });
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
    // 2️⃣ Find the most recently updated key
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-12-31T23:59:59Z");
    const matches = await Match.find({
      date: { $gte: startDate, $lt: endDate },
    });
    console.log(matches?.length, 'matchest')

    for (let match of matches) {
      try {
        console.log(match?.matchId, 'its matchid')
        const matchExists = await MatchLiveDetails.findOne({ matchId: match.matchId });
        console.log
        if (matchExists) continue;
        const keys = await squadkeys(match?.matchId) //await squadkeys(match.matchId);
        console.log(keys, 'keyzzs')
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
            const ratelimit = parseInt(data.headers['x-ratelimit-requests-remaining']);
            let usageCount = 100 - ratelimit;
            if (usageCount == 100 || (!keys)) {
              await RapidApiKey.updateOne({ apiKey: keys }, { $set: { usageCount: usageCount, status: 'inactive' } })
              // 2️⃣ Find the most recently updated key
              const latestKey = await RapidApiKey.findOne({ type: 'lineups' }).sort({ updatedAt: 1 });

              // 3️⃣ Activate that key
              if (latestKey) {
                await RapidApiKey.updateOne(
                  { _id: latestKey._id },
                  { $set: { status: 'active' } }
                );
              }
            }
            else {
              await RapidApiKey.updateOne({ apiKey: keys }, { $set: { usageCount: usageCount, status: 'active' } })
            }
            console.log(ratelimit, 'ratelimit', usageCount)
            console.log(data?.team1?.players?.[0].player, 'data for players')
            players1 = data.team1.players?.[0].player || data.team1.players["Squad"]
            players2 = data.team2.players?.[0].player || data.team2.players["Squad"]
            captain1 = players1.find((p) => p.captain)
            captain2 = players2.find((p) => p.captain)
            const team1Players = players1.map(p => ({
              playerId: p.id,
              playerName: p.name,
              image: p.faceimageid,
              points: 4,
              position: p.role === "Unknown" ? "Batsman" : p.role,
              batOrder: -1
            }));

            const team2Players = players2.map(p => ({
              playerId: p.id,
              playerName: p.name,
              image: p.faceimageid,
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
            if (match?.importance == "very_high" || match?.importance == "high") {
              let tweetText = `Lineups Out: ${match.teamHomeName} vs ${match.teamAwayName}\nThe lineups for ${match.teamHomeName} and ${match.teamAwayName} are now available. Check out the details!
        https://www.cricbuzz.com/live-cricket-scores/${match?.matchId} \n${generateMatchHashtags(match.teamHomeCode, match.teamAwayCode, match.matchTitle)}`
              await sendNotification(`Lineups Out: ${match.teamHomeName} vs ${match.teamAwayName}`, `The lineups for ${match.teamHomeName} and ${match.teamAwayName} are now available.`
              );
              await createVsImage(match.teamHomeCode, match.teamAwayCode, captain1, captain2, `./images/${match.matchId}_vs_image.png`, match?.date); // Assuming first player is captain
              await sendTweetWithImage(tweetText, `./images/${match.matchId}_vs_image.png`);
              delay(2000)
              let time = Math.floor(
                (new Date(match.enddate) - new Date(match.date)) / (1000 * 60)
              );
              let pollTweet = `who will win man of the match? \n${generateMatchHashtags(match.teamHomeCode, match.teamAwayCode, match.matchTitle)}`
              let players = [...liveMatch.teamHomePlayers.slice(0, 2).map((h) => h.playerName), ...liveMatch.teamAwayPlayers.slice(0, 2).map((h) => h.playerName)]
              await sendTweetWithPoll(pollTweet, [...players], time)
              await delay(2000)
              let pollTweet2 = `who will win the match? \n${generateMatchHashtags(match.teamHomeCode, match.teamAwayCode, match.matchTitle)}`
              let teams = [match.teamHomeName, match.teamAwayName]
              await sendTweetWithPoll(pollTweet2, [...teams], time)
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
      catch (error) {
        console.log(error, 'it is error');
        const latestKey = await RapidApiKey.findOne({ type: 'lineups' }).sort({ updatedAt: 1 });

        // 3️⃣ Activate that key
        if (latestKey) {
          await RapidApiKey.updateOne(
            { _id: latestKey._id },
            { $set: { status: 'active' } }
          );
        }
      }
    }
  } catch (error) {
    console.log(error, 'it is error');
    const latestKey = await RapidApiKey.findOne({ type: 'lineups' }).sort({ updatedAt: 1 });

    // 3️⃣ Activate that key
    if (latestKey) {
      await RapidApiKey.updateOne(
        { _id: latestKey._id },
        { $set: { status: 'active' } }
      );
    }
  }
};
