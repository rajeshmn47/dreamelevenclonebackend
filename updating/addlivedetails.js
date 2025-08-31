const request = require("request");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const { messaging } = require("../utils/firebaseinitialize");
const sendTweet = require("../utils/sendTweet");
const { getkeys } = require("../utils/apikeys");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  const normalizedSeries = seriesName.toLowerCase();

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
      const s = JSON.parse(body);
      resolve(s);
    });
  });
}

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

module.exports.addLiveDetails = async function () {
  try {
    const turing = await MatchLive();
    let date = new Date();
    const endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
    date = new Date(date.getTime() - 2 * 60 * 60 * 1000);
    const matches = await Match.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      },
    });
    console.log(matches.length, 'matches length')
    for (let i = 0; i < matches.length; i++) {
      const matchId = matches[i].matchId;
      const match = await MatchLive.findOne({ matchId: matchId });
      if (match) {
        console.log('exists');
      } else {
        const keys = await getkeys()
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

        let success = false;
        while (!success) {
          try {
            await delay(300); // Add a delay of 1 second between requests
            const s = await makeRequest(options);
            success = true;
            console.log(s, 's')
            if (s.team1 != null && s.team1.length != 0) {
              const LiveMatchDet = new MatchLive();
              LiveMatchDet.matchId = matchId;
              LiveMatchDet.date = date1;
              const r = [];
              for (const x of s.team1.playerDetails) {
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
              for (const x of s.team2.playerDetails) {
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

                // Example usage in your logic
                sendNotification(
                  `Lineups Out: ${s.matchInfo.team1.name} vs ${s.matchInfo.team2.name}`,
                  `The lineups for ${s.matchInfo.team1.name} and ${s.matchInfo.team2.name} are now available. Check out the details!`
                );
                const team1Name = matches[i]?.teamHomeCode || "Team1";
                const team2Name = matches[i]?.teamAwayCode || "Team2";
                //const matchHashtags = `#${team1Name.replace(/\s/g, '')}Vs${team2Name.replace(/\s/g, '')} #Cricket #ipl2025`;
                const matchHashtags = generateMatchHashtags(team1Name, team2Name, matches[i]?.matchTitle || "IPL");
                let tweetText = `The lineups for ${s.matchInfo.team1.name} and ${s.matchInfo.team2.name} are now available. Check out the details! Match Link: https://dream-11-clone-nu.vercel.app ${matchHashtags}`;
                sendTweet(tweetText);
              }
            }
          } catch (error) {
            if (error.message.includes('rate limit')) {
              console.log('Rate limit exceeded, retrying...');
              await delay(1000); // Wait for 1 second before retrying
            } else {
              console.log(error);
              success = true; // Exit the loop on other errors
            }
          }
        }
      }
    }
  }
  catch (error) {
    console.log(error)
  }
};
