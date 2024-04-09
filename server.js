require("dotenv").config();
var express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
var express = require("express");
const path = require('path');
const cricLive = require("cric-live");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const bodyParser = require("body-parser");
const home = require("./controllers/homecontroller");
const video = require("./controllers/videocontroller");
const contest = require("./controllers/contestsController");
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
const getkeys = require("./utils/crickeys");
const { checkloggedinuser } = require("./utils/checkUser.js");
const player = require("./routes/playerDetails");
const series = require("./routes/series");
var fs = require('fs');
// Environment variables
/* Requiring body-parser package
to fetch the data that is entered
by the user in the HTML form. */
// Allowing app to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", credentials: false }));
app.use('/images', express.static(path.join('images')));
app.use("/auth", auth);
app.use("/", player);
app.use("/", series);
app.use("/payment", checkloggedinuser, payments);
app.use("/", checkloggedinuser, home);
app.use("/", checkloggedinuser, contest);
app.use("/", checkloggedinuser, teamdata);
app.use("/", checkloggedinuser, team);
app.use("/", checkloggedinuser, updatedata);
app.use("/", checkloggedinuser, video);
//app.use("/", transaction);
mongoose.Promise = global.Promise;
mongoose.connect(
  process.env.uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    if (error) {
      console.log(`Error!${error}`);
    }
    else {
      console.log('connected to database')
    }
  }
);
const api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
// ...

// Remove the error.log file every twenty-first day of the month.
//addLiveCommentary.addLivecommentary();
cron.schedule("0 * * * *", async function () {
  await transaction.startTransaction();
});
cron.schedule("* * * * *", async function () {
  await addLiveCommentary.addLivecommentary();
});
cron.schedule("*/2 * * * *", async function () {
  await teamstandings.addTeamstandingstodb();
});
cron.schedule("*/3 * * * *", async function () {
  await addlivescoresnew.addLivematchtodb();
});
cron.schedule("*/5 * * * *", async function () {
  await addlivenew.addLivematchtodb();
});
cron.schedule("0 22 * * *", async function () {
  await matches.addMatchtoDb();
  await addingteam.addPlayers();
});
cron.schedule("0 */20 * * *", async function () {
  await addingteame.addteamPlayers();
});
cron.schedule("0 */1 * * *", async function () {
  await addIds.addMatchIds();
});
// addlivenew.addLivematchtodb();
// addlivescoresnew.addLivematchtodb();
// addIds.addMatchIds();
// teamstandings.addTeamstandingstodb();
// addingteame.addteamPlayers();
// matches.addMatchtoDb()
// teamstandingsA.addTeamstandingstodb()
// addingteam.addPlayers();
// transaction.startTransaction();
// addLiveCommentary.addLivecommentary();
const PORT = process.env.PORT || 8000;
app.listen(8000, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
