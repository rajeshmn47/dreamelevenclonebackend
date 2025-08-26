require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

// Twitter API credentials
const clientId = process.env.TWITTER_CLIENT_ID;
const clientSecret = process.env.TWITTER_CLIENT_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_SECRET;
const appKey = process.env.API_KEY;
const appSecret = process.env.API_KEY_SECRET;
// Function to send a tweet
async function sendTweet(text) {
  try {
    const twitterClient = new TwitterApi({
      appKey: appKey,
      appSecret: appSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // const roClient = twitterClient.readOnly;

    const tweet = await twitterClient.v2.tweet(text);
    console.log('Tweet sent successfully:', tweet.data.id);
    return tweet.data;
  } catch (error) {
    console.error('Error sending tweet:', error);
    throw error;
  }
}

async function sendTweetWithVideo(text, videoPath) {
  try {
    const videoData = fs.readFileSync(videoPath);
    const twitterClient = new TwitterApi({
      appKey: appKey,
      appSecret: appSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // Upload media (Twitter handles chunking internally)
    const mediaId = await twitterClient.v1.uploadMedia(videoData, { type: 'video/mp4' });

    // Post the tweet with video
    const tweet = await twitterClient.v2.tweet({
      text,
      media: {
        media_ids: [mediaId],
      },
    });

    console.log('Tweet with video sent successfully:', tweet.data.id);
    return tweet.data;
  } catch (error) {
    console.error('Error sending tweet with video:', error);
    throw error;
  }
}

module.exports = {sendTweet,sendTweetWithVideo};