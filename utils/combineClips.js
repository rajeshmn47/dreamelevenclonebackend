const ffmpeg = require("fluent-ffmpeg");
const { combineMatchVideos } = require("./videoTools");
const path = require("path");
const fs = require("fs");

async function addOverlayToClip(inputPath, outputPath, overlayText, wickets) {
  return new Promise((resolve, reject) => {
    const batsmanText = `${overlayText.batsmanStriker.batName} ${overlayText.batsmanStriker.batRuns} (${overlayText.batsmanStriker.batBalls})*`;
    //const batsmanNonText = `${overlayText.batsmanNonStriker.batName} ${overlayText.batsmanNonStriker.batRuns} (${overlayText.batsmanNonStriker.batBalls})`;
    const bowlerText = `${overlayText.bowlerStriker.bowlName} ${overlayText.bowlerStriker.bowlWkts}/${overlayText.bowlerStriker.bowlRuns} (${overlayText.bowlerStriker.bowlOvs})`;
    const scoreText = `${overlayText.batTeamName}  ${overlayText.batTeamScore} - ${wickets}`;
    const batsmanTeam = overlayText.batTeamName;
    const drawBox = `drawbox=x=0:y=ih-50:w=iw:h=50:color=0x1E1F4D@1:t=fill`;
    const drawScore = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${scoreText}':x=20:y=h-43:fontsize=16:fontcolor=white`;
    const drawOver = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Over ${overlayText?.overNumber}':x=20:y=h-18:fontsize=16:fontcolor=0xFFD700`;
    const drawBatsman = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${batsmanText}':x=200:y=h-43:fontsize=16:fontcolor=0xFFFFFF`;
    //const drawBatsmanNon = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${batsmanNonText}':x=200:y=h-35:fontsize=24:fontcolor=0xFFFFFF`;
    const drawBowler = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${bowlerText}':x=200:y=h-18:fontsize=16:fontcolor=0x00BFFF`;
    const drawOutcome = `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${2}':x=850:y=h-18:fontsize=16:fontcolor=0xFFA500`;

    const vfString = `${drawBox},${drawScore},${drawOver},${drawBatsman},${drawBowler},${drawOutcome}`;
    console.log(vfString, "vfString");
    ffmpeg(inputPath)
      .videoFilters(vfString)
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

async function appendClipWithOverlay(videoLink, matchId, overlayText, wickets) {
  const originalClipPath = path.resolve(`D:/compressed_240p/${videoLink}`);
  const overlayedClipPath = path.join(__dirname, `../temp/overlay_${Date.now()}.mp4`);
  const finalVideoPath = path.join(__dirname, `../public/final_videos/final_${matchId}.mp4`);
  const tempCombinedPath = path.join(__dirname, `../temp/combined_${matchId}_${Date.now()}.mp4`);

  try {
    // 1. Overlay the clip
    await addOverlayToClip(originalClipPath, overlayedClipPath, overlayText, wickets);

    // 2. Append to existing final video
    const inputs = (fs.existsSync(finalVideoPath) && fs.existsSync(overlayedClipPath))
      ? [finalVideoPath, overlayedClipPath]
      : [overlayedClipPath];

    await combineMatchVideos(inputs, tempCombinedPath);

    // 3. Replace final video
    fs.renameSync(tempCombinedPath, finalVideoPath);
    fs.unlinkSync(overlayedClipPath); // Clean temp overlay

    console.log(`✅ Added overlay and appended to final_${matchId}.mp4`);
  } catch (err) {
    console.error(`❌ Failed to process video for ${matchId}:`, err);
  }
}

module.exports = { appendClipWithOverlay };

