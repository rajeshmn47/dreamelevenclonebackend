const cron = require("node-cron");
const { startTransaction } = require("./transaction.js");
const { addMatchtoDb } = require("./addMatch.js");
const { addLivescoresDetails } = require("./addlivescoresdetails.js");
const { addLiveDetails } = require("./addlivedetails.js");
const { addLivecommentary } = require("./addCommentary.js");
const { addTeamstandingstodb } = require("./updateteam.js");
const { addTeamstandingstodbAPI } = require("./updatestandings.js");
const { addPlayersAPI } = require("./addplayer.js");
const { addteamPlayers } = require("./teamcreatecontroller.js");
const { addMatchIds } = require("./addMatchIds.js");
const { updateBalls } = require("./updateBalls.js");
const { addInPlayStatus } = require("./addInPlayStatus.js");
const { addLivescoresDetailsCustom } = require("./addlivescoresdetailskeys.js");
const { addLivecommentaryCustom } = require("./addCommentaryCustom.js");
const { startCryptoTransaction } = require("./cryptoTransaction.js");
const { addLivescoresDetailsCustomfs } = require("./addScoredetailsCustom.js");
const { updateSeries } = require("./addSeries.js");
const { updateSquads } = require("./updateSquads.js");
const { addLiveDetailsFS } = require("./addlivedetailsFS.js");
const config = require("../models/config.js");
const { addInPlayStatusFS } = require("./addInPlayStatusFS.js");

const isSource = process.env.SOURCE === "true";

let jobs = {}; // store references to all cron jobs

function getCronPattern(minutes) {
  if (minutes < 1) return "* * * * *";
  return `*/${minutes} * * * *`;
}

// Stop all existing cron jobs
function stopAllJobs() {
  for (let key in jobs) {
    jobs[key]?.stop();
    delete jobs[key];
  }
  console.log("🛑 All cron jobs stopped");
}

// Schedule all cron jobs dynamically
async function scheduleJobs(frequencies) {
  stopAllJobs();

  // General jobs (always run)
  jobs.startTransaction = cron.schedule("0 * * * *", async () => {
    await startTransaction()
  });

  jobs.startCryptoTransaction = cron.schedule("0 * * * *", async () => {
    await startCryptoTransaction()
  });

  jobs.updateBalls = cron.schedule("* * * * *", async () => {
    await updateBalls()
  });

  jobs.teamStandings = cron.schedule("*/2 * * * *", async () => {
    await addTeamstandingstodb()
  });

  // Source mode jobs
  if (isSource) {
    jobs.liveDetails = cron.schedule("*/5 * * * *", async () => {
      await addLiveDetails()
    })
    jobs.inPlayStatus = cron.schedule("*/15 7-23 * * *", async () => {
      await addInPlayStatus()
    });

    jobs.test = cron.schedule(getCronPattern(frequencies.test), async () => {
      await addLivescoresDetailsCustom("test");
    });

    jobs.odi = cron.schedule(getCronPattern(frequencies.odi), async () => {
      await addLivescoresDetailsCustom("odi");
    });

    jobs.t20 = cron.schedule(getCronPattern(frequencies.t20), async () => {
      await addLivescoresDetailsCustom("t20");
    });

    jobs.important = cron.schedule(getCronPattern(frequencies.important), async () => {
      await addLivescoresDetailsCustom("important");
    });

    jobs.unimportant = cron.schedule(getCronPattern(frequencies.important), async () => {
      await addLivescoresDetailsCustom("unimportant");
    });

    jobs.liveCommentaryTest = cron.schedule("*/15 * * * *", async () => {
      await addLivecommentaryCustom("test");
    });

    jobs.liveCommentaryOdi = cron.schedule("*/10 * * * *", async () => {
      await addLivecommentaryCustom("odi");
    });

    jobs.liveCommentaryT20 = cron.schedule("* * * * *", async () => {
      await addLivecommentaryCustom("t20");
    });

    console.log("✅ Cron jobs scheduled for source mode");
  } else {
    // Non-source mode
    jobs.liveDetailsFS = cron.schedule("*/5 * * * *", async () => {
      await addLiveDetailsFS();
    });
    jobs.inPlayStatusFS = cron.schedule("*/15 7-23 * * *", async () => {
      await addInPlayStatusFS()
    });
    jobs.testFS = cron.schedule(getCronPattern(frequencies.test), async () => {
      await addLivescoresDetailsCustomfs("test");
    });
    jobs.odiFS = cron.schedule(getCronPattern(frequencies.odi), async () => {
      await addLivescoresDetailsCustomfs("odi");
    });
    jobs.t20FS = cron.schedule(getCronPattern(frequencies.t20), async () => {
      await addLivescoresDetailsCustomfs("t20");
    });
    jobs.importantFS = cron.schedule(getCronPattern(frequencies.important), async () => {
      await addLivescoresDetailsCustomfs("important");
    });
    jobs.unimportantFS = cron.schedule(getCronPattern(frequencies.important), async () => {
      await addLivescoresDetailsCustomfs("unImportant");
    });

    console.log("ℹ️ Cron jobs scheduled for non-source mode");
  }

  // Other periodic jobs
  jobs.addMatchDb = cron.schedule("0 */6 * * *", async () => {
    await addMatchtoDb();
    await addteamPlayers();
  });

  jobs.updateSeriesSquads = cron.schedule("0 */12 * * *", async () => {
    await updateSeries();
    await updateSquads();
  });

  jobs.teamStandings20 = cron.schedule("0 */20 * * *", async () => {
    await addTeamstandingstodb()
  });
  jobs.addMatchIds = cron.schedule("0 */1 * * *", async () => {
    await addMatchIds()
  });
}

// Initialize cron jobs on startup
async function cronjobs() {
  const cfg = await config.findOne();
  const frequencies = cfg?.frequencies || { t20: 2, odi: 5, test: 15, important: 1 };
  await scheduleJobs(frequencies);
}

module.exports = { cronjobs, scheduleJobs };
