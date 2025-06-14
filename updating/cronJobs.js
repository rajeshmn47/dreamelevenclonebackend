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

const isSource = process.env.SOURCE === "true" ? true : false;

function cronjobs() {
  cron.schedule("0 * * * *", async function () {
    await startTransaction();
  });
  cron.schedule("0 * * * *", async function () {
    await startCryptoTransaction();
  });
  //cron.schedule("* * * * *", async function () {
  //  await addLivecommentary();
  //});
  cron.schedule("* * * * *", async function () {
    await updateBalls();
  });
  cron.schedule("*/2 * * * *", async function () {
    await addTeamstandingstodb();
  });
  cron.schedule("*/5 * * * *", async function () {
    await addLiveDetails()
  });
  //cron.schedule("* * * * *", async function () {
  //  await addLivescoresDetails()
  //});
  if (isSource) {
    cron.schedule("*/15 * * * *", async function () {
      await addLivescoresDetailsCustom('test');
    });

    cron.schedule("*/10 * * * *", async function () {
      await addLivescoresDetailsCustom('odi');
    });

    cron.schedule("* * * * *", async function () {
      await addLivescoresDetailsCustom('t20');
    });
    cron.schedule("*/15 * * * *", async function () {
      await addLivecommentaryCustom('test');
    });
    cron.schedule("*/10 * * * *", async function () {
      await addLivecommentaryCustom('odi');
    });
    cron.schedule("* * * * *", async function () {
      await addLivecommentaryCustom('t20');
    });
    console.log("✅ Cron jobs scheduled for source mode");
  } else {
    cron.schedule("*/15 * * * *", async function () {
      await addLivescoresDetailsCustomfs('test');
    });

    cron.schedule("*/10 * * * *", async function () {
      await addLivescoresDetailsCustomfs('odi');
    });

    cron.schedule("* * * * *", async function () {
      await addLivescoresDetailsCustomfs('t20');
    });
    console.log("ℹ️ Skipping cron jobs — not in source mode");
  }
  cron.schedule("0 */6 * * *", async function () {
    await addMatchtoDb();
    await addteamPlayers();
  });
  cron.schedule("0 */12 * * *", async function () {
    await updateSeries()
    await updateSquads()
  });
  cron.schedule("0 */20 * * *", async function () {
    await addTeamstandingstodb()
  });
  cron.schedule("0 */1 * * *", async function () {
    await addMatchIds();
  });
  cron.schedule("*/15 7-23 * * *", async () => {
    await addInPlayStatus();
  });
}

module.exports = { cronjobs };