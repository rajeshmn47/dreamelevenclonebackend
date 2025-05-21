const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

/**
 * Combine multiple MP4 clips into one final video using FFmpeg concat demuxer.
 * @param {string[]} inputPaths - Array of full file paths to video clips.
 * @param {string} outputPath - Path where final combined video will be saved.
 */
async function combineMatchVideos(inputPaths, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create concat list file
      const listFilePath = path.join(__dirname, "../temp/concat_list.txt");
      const concatText = inputPaths.map(p => `file '${p}'`).join("\n");
      fs.writeFileSync(listFilePath, concatText);

      ffmpeg()
        .input(listFilePath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"]) // no re-encoding, fast
        .output(outputPath)
        .on("end", () => {
          fs.unlinkSync(listFilePath); // cleanup
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg combine error:", err);
          reject(err);
        })
        .run();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { combineMatchVideos };
