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
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `*/${seconds} * * * * *`; // seconds-level cron
  }
  return `*/${minutes} * * * *`;
}

console.log(getCronPattern(0.5), 'pattern')

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

  jobs.updateBalls = cron.schedule("*/5 * * * *", async () => {
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
    jobs.inPlayStatus = cron.schedule("*/10 7-23 * * *", async () => {
      await addInPlayStatus()
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
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

    jobs.high = cron.schedule(getCronPattern(frequencies.high), async () => {
      await addLivescoresDetailsCustom("high");
    });

    jobs.very_high = cron.schedule(getCronPattern(frequencies.very_high), async () => {
      await addLivescoresDetailsCustom("very_high");
    });

    jobs.low = cron.schedule(getCronPattern(frequencies.low), async () => {
      await addLivescoresDetailsCustom("low");
    });

    jobs.liveCommentaryTest = cron.schedule(getCronPattern(frequencies.test), async () => {
      await addLivecommentaryCustom("test");
    });
    jobs.liveCommentaryOdi = cron.schedule(getCronPattern(frequencies.odi), async () => {
      await addLivecommentaryCustom("odi");
    });
    jobs.liveCommentaryT20 = cron.schedule(getCronPattern(frequencies.t20), async () => {
      await addLivecommentaryCustom("t20");
    });
    jobs.liveCommentaryImportant = cron.schedule(getCronPattern(frequencies.very_high), async () => {
      await addLivecommentaryCustom("very_high");
    });
    jobs.liveCommentaryNotImportant = cron.schedule(getCronPattern(frequencies.high), async () => {
      await addLivecommentaryCustom("high");
    });
    jobs.liveCommentaryNotImportant = cron.schedule(getCronPattern(frequencies.low), async () => {
      await addLivecommentaryCustom("low");
    });

    console.log("✅ Cron jobs scheduled for source mode");
  } else {
    // Non-source mode
    jobs.liveDetailsFS = cron.schedule("*/5 * * * *", async () => {
      await addLiveDetailsFS();
    });
    jobs.inPlayStatusFS = cron.schedule("*/10 7-23 * * *", async () => {
      await addInPlayStatusFS()
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
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

    jobs.high = cron.schedule(getCronPattern(frequencies.high), async () => {
      await addLivescoresDetailsCustomfs("high");
    });

    jobs.very_high = cron.schedule(getCronPattern(frequencies.very_high), async () => {
      await addLivescoresDetailsCustomfs("very_high");
    });

    jobs.low = cron.schedule(getCronPattern(frequencies.low), async () => {
      await addLivescoresDetailsCustomfs("low");
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
  console.log(cfg?.frequencies, 'frequencies')
  const frequencies = cfg?.frequencies || { t20: 2, odi: 5, test: 15, important: 1 };
  await scheduleJobs(frequencies);
}

module.exports = { cronjobs, scheduleJobs };
