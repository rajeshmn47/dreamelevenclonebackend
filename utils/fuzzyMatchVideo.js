const fs = require('fs');
const { OpenAI } = require("openai");
require("dotenv").config();
const path = require('path');

const videoFolder = path.join(__dirname, '../sachinshots');

const openai = new OpenAI({
  apiKey: process.env.OPENAIKEY,
});

let videoFiles = fs.readdirSync(videoFolder).filter(file => file.endsWith('.mp4'));

async function getBestMatchingVideo(commentary) {
  const messages = [
    {
      role: "system",
      content: `You're a cricket expert. From the given commentary and a list of video file names, return only the best matching video filename (like "pullshot.mp4"). If no match, return "unknown". Only return the exact filename.`,
    },
    {
      role: "user",
      content: `Commentary: "${commentary}"\n\nVideo Files: ${videoFiles.join(", ")}`,
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.2,
    });

    // Get content
    let result = response.choices[0].message.content.trim();

    // Match exact filename pattern
    const match = result.match(/[\w\-]+\.mp4/i);
    return match ? match[0] : "unknown";
  } catch (error) {
    console.error("❌ GPT Error:", error.message);
    return "unknown";
  }
}

module.exports.fuzzyMatchVideo = getBestMatchingVideo;
