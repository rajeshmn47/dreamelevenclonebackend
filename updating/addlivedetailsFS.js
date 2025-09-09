const request = require("request");
const Match = require("../models/match");
const MatchLive = require("../models/matchlive");
const getkeys = require("../utils/crickeys");
const { messaging } = require("../utils/firebaseinitialize");
const sendTweet = require("../utils/sendTweet");

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

module.exports.addLiveDetailsFS = async function () {
  try {
    const turing = await MatchLive();
    let date = new Date();
    const endDate = new Date(date.getTime() + 0.5 * 60 * 60 * 1000);
    date = new Date(date.getTime() - 12 * 60 * 60 * 1000);
    const matches = await Match.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      },
    });
    for (let i = 0; i < matches.length; i++) {
      const matchId = matches[i].matchId;
      const match = await MatchLive.findOne({ matchId: matchId });
      if (match) {
        //console.log('exists');
      } else {
        //const keys = await getkeys.getkeys();
        //console.log(s,'not exists')
        const date1 = matches[i].date
        const URL = process.env.BACKEND_URL || "http://localhost:9000";
        const options = {
          method: "GET",
          url: `${URL}/api/match/live-details/${matchId}`,
          headers: {
            "servertoken": process.env.SERVER_TOKEN, // if you use server token for auth
          },
        };

        let success = false;
        while (!success) {
          try {
            await delay(300); // Add a delay of 1 second between requests
            console.log('Making request for matchId:', matchId);
            const s = await makeRequest(options);
            success = true;
            console.log(s, 's')
            if (s?.teamAwayId != null && s?.teamAwayId != undefined && s?.teamHomeId != null && s?.teamHomeId != undefined) {
              const LiveMatchDet = new MatchLive();
              LiveMatchDet.matchId = matchId;
              LiveMatchDet.date = date1;
              LiveMatchDet.teamHomePlayers = s.teamHomePlayers;
              LiveMatchDet.teamAwayPlayers = s.teamAwayPlayers;
              LiveMatchDet.teamHomeId = s.teamHomeId;
              LiveMatchDet.teamAwayId = s.teamAwayId;
              LiveMatchDet.isInPlay = true;
              const m = await MatchLive.findOne({ matchId });
              const match = await MatchLive.create(LiveMatchDet);
              if (match) {
                console.log(
                  "Live Details of match is successfully added in db! "
                );

                // Example usage in your logic
                //sendNotification(
                //  `Lineups Out: ${s.teamHomeName} vs ${s.teamAwayName}`,
                //  `The lineups for ${s.teamHomeName} and ${s.teamAwayName} are now available. Check out the details!`
                //);
                const team1Name = matches[i]?.teamHomeCode || "Team1";
                const team2Name = matches[i]?.teamAwayCode || "Team2";
                //const matchHashtags = `#${team1Name.replace(/\s/g, '')}Vs${team2Name.replace(/\s/g, '')} #Cricket #ipl2025`;
                const matchHashtags = generateMatchHashtags(team1Name, team2Name, matches[i]?.matchTitle || "IPL");
                let tweetText = `The lineups for ${s.teamHomeName} and ${s.teamAwayName} are now available. Check out the details! Match Link: https://www.cricbuzz.com/live-cricket-scores/${match?.matchId}
                ${matchHashtags}`;
                if (matches[i]?.important) {
                  sendTweet(tweetText);
                }
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
