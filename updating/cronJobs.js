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

function cronjobs() {
  cron.schedule("0 * * * *", async function () {
    //await startTransaction();
  });
  cron.schedule("* * * * *", async function () {
    //await addLivecommentary();
  });
  cron.schedule("* * * * *", async function () {
    //await updateBalls();
  });
  cron.schedule("*/2 * * * *", async function () {
    //await addTeamstandingstodb();
  });
  cron.schedule("*/5 * * * *", async function () {
    //await addLiveDetails()
  });
  cron.schedule("* * * * *", async function () {
    //await addLivescoresDetails()
  });
  cron.schedule("0 22 * * *", async function () {
    //await addMatchtoDb();
    //await addteamPlayers();
  });
  cron.schedule("0 */20 * * *", async function () {
    //await addTeamstandingstodb()
  });
  cron.schedule("0 */1 * * *", async function () {
    //await addMatchIds();
  });
  cron.schedule("*/15 7-23 * * *", async () => {
    //await addInPlayStatus();
  });
}

module.exports = { cronjobs };