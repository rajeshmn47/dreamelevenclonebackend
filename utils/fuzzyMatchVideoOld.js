const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const videoFolder = path.join(__dirname, '../sachinshots');

function extractShotKeyword(commentary) {
  const knownShots = [
    "pull", "hook", "cut", "square cut", "flick", "glance",
    "drive", "straight drive", "cover drive", "loft", "sweep", "reverse sweep",
    "heave", "dab", "uppercut", "scoop", "switch hit"
  ];

  commentary = commentary.toLowerCase();

  for (let shot of knownShots) {
    if (commentary.includes(shot)) {
      return shot;
    }
  }

  // fallback if nothing matched
  return null;
}

function fuzzyMatchVideo(commentary) {
  let files;
  try {
    files = fs.readdirSync(videoFolder).filter(file => file.endsWith('.mp4'));
  } catch (error) {
    console.error("❌ Error reading video folder:", videoFolder);
    return null;
  }

  if (!files.length) return null;

  const shotKeyword = extractShotKeyword(commentary);
  let bestMatch = '';
  let highestScore = 0;

  for (const file of files) {
    const baseName = file.toLowerCase().replace(/\.mp4$/, '');
    const similarity = stringSimilarity.compareTwoStrings(commentary.toLowerCase(), baseName);
    let score = similarity;

    // Boost score if the shot keyword is in the filename
    if (shotKeyword && baseName.includes(shotKeyword.replace(/\s/g, ''))) {
      score += 0.4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = file;
    }
  }

  if (bestMatch && highestScore > 0.2) {
    console.log(`🎥 Best Matching Video: ${bestMatch} (Score: ${highestScore})`);
    return bestMatch;
  } else {
    console.log("⚠️ No good match found");
    return null;
  }
}

module.exports.fuzzyMatchVideo = fuzzyMatchVideo;
