require("dotenv").config();
var express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
var express = require("express");
const cricLive = require("cric-live");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const bodyParser = require("body-parser");
const home = require("./controllers/homecontroller");
const video = require("./controllers/videocontroller");
const contest = require("./controllers/getcontests");
const teamdata = require("./controllers/getplayerscontroller");
const auth = require("./controllers/user_controller");
const team = require("./controllers/teamcontroller");
const payments = require("./controllers/payment");
const teamstandingsA = require("./controllers/updatestandings");
const updatedata = require("./controllers/updatedata");
const transaction = require("./controllers/transaction");
const matches = require("./controllers/matchDB-controller");
const fMatches = require("./controllers/fMatchDB-controller");
const addLiveCommentary = require("./controllers/firebase");
const teamstandings = require("./controllers/updateteam");
const addlivescoresnew = require("./controllers/addlivescoresdetails");
const addlivenew = require("./controllers/addlivedetails");
const addingteam = require("./controllers/addplayer");
const addingteame = require("./controllers/teamcreatecontroller");
const addIds = require("./controllers/addMatchIds");
const getkeys = require("./crickeys");
// Environment variables
/* Requiring body-parser package
to fetch the data that is entered
by the user in the HTML form. */
// Allowing app to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", credentials: false }));
app.use("/", home);
app.use("/", contest);
app.use("/", teamdata);
app.use("/", team);
app.use("/", updatedata);
app.use("/", video);
//app.use("/", transaction);
app.use("/payment", payments);
app.use("/auth", auth);
mongoose.Promise = global.Promise;
mongoose.connect(
  process.env.uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    if (error) {
      console.log(`Error!${error}`);
    }
  }
);
const api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
// ...

// Remove the error.log file every twenty-first day of the month.
cron.schedule("0 * * * *", async function () {
  await transaction.startTransaction();
});
cron.schedule("* * * * *", async function () {
  await addLiveCommentary.addLivecommentary();
});
cron.schedule("*/5 * * * *", async function () {
  await teamstandings.addTeamstandingstodb();
});
cron.schedule("*/5 * * * *", async function () {
  await addlivescoresnew.addLivematchtodb();
});
cron.schedule("*/10 * * * *", async function () {
  await addlivenew.addLivematchtodb();
});
cron.schedule("0 0 * * 1", async function () {
  await matches.addMatchtoDb();
  await addingteam.addPlayers();
});
cron.schedule("0 */20 * * *", async function () {
  await addingteame.addteamPlayers();
});
cron.schedule("0 */8 * * *", async function () {
  await addIds.addMatchIds();
});
// livedetails.addLivematchtodb();
// livescore.addLivematchtodb();
// addIds.addMatchIds();
// teamstandings.addTeamstandingstodb();
// matches.addMatchtoDb()
// teamstandingsA.addTeamstandingstodb()
// addplayers.addPlayers();
// transaction.startTransaction();
async function gettingkeys() {
  const data = await getkeys.getkeys();
  console.log(data, "keys");
}
//gettingkeys();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
