require("dotenv").config();
var express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
var express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const home = require("./controllers/homecontroller");
const video = require("./controllers/video/videocontroller.js");
const contest = require("./controllers/contestsController");
const teamdata = require("./controllers/playerscontroller.js");
const auth = require("./controllers/user_controller");
const team = require("./controllers/teamcontroller");
const apikeys = require("./controllers/apikeysController.js");
const payments = require("./controllers/paymentcontroller.js");
const matches = require("./controllers/matchcontroller.js");
const cryptoPaymentController = require("./routes/cryptoPaymentRoutes.js");
const cryptoContestController = require("./controllers/cryptoContestsController.js");
const updatedata = require("./updating/updatedata.js");
const fMatches = require("./controllers/football/fMatchDB-controller.js");
const player = require("./routes/playerDetails");
const series = require("./routes/series");
const admin = require("./controllers/admincontroller.js");
const { startTransaction } = require("./updating/transaction.js");
const { addMatchtoDb } = require("./updating/addMatch.js");
const { addLivescoresDetails } = require("./updating/addlivescoresdetails.js");
const { addLiveDetails } = require("./updating/addlivedetails.js");
const { addLivecommentary } = require("./updating/addCommentary.js");
const { addTeamstandingstodb } = require("./updating/updateteam.js");
const { addTeamstandingstodbAPI } = require("./updating/updatestandings.js");
const { addPlayersAPI } = require("./updating/addplayer.js");
const { addteamPlayers } = require("./updating/teamcreatecontroller.js");
const { addMatchIds } = require("./updating/addMatchIds.js");
const { getkeys } = require("./utils/crickeys");
const { checkloggedinuser, checkloggedinadmin } = require("./utils/checkUser.js");
const { updateBalls } = require("./updating/updateBalls.js");
const { addInPlayStatus } = require("./updating/addInPlayStatus.js");
const { createDefaultContestTypes } = require("./updating/createContestTypes.js");
const { cronjobs } = require("./updating/cronJobs.js");
const { startCryptoTransaction } = require("./updating/cryptoTransaction.js");
const configRoutes = require("./controllers/configurationController.js");
const { addLivecommentaryCustom } = require("./updating/addCommentaryCustom.js");
const { addLivescoresDetailsCustomfs } = require("./updating/addScoredetailsCustom.js");
const { addLivescoresDetailsCustom } = require("./updating/addlivescoresdetailskeys.js");
const { updateSeries } = require("./updating/addSeries.js");
const { updateSquads } = require("./updating/updateSquads.js");
//const { generateShotTypes } = require("./generate_shottype.js");
const { fetchAndSaveTeams } = require("./updating/createTeams.js");
const { addMatchesForAllCurrentSeries } = require("./updating/addMatchFromSeries.js");
const { addLiveDetailsFS } = require("./updating/addlivedetailsFS.js");
const { updateSeriesArchives } = require("./updating/addSeriesArchives.js");
const Clip = require("./models/clips.js");
const { default: axios } = require("axios");
const { addInPlayStatusFS } = require("./updating/addInPlayStatusFS.js");
const { addLivePlayers } = require("./updating/addLivePlayers.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", credentials: false }));
app.use('/images', express.static(path.join('images')));
app.use('/mockvideos', express.static(path.join('sachinshots')));
app.use('/mockvideos', express.static(path.join('allvideos')));
app.use('/mockvideos', express.static(path.join('allclips')));
app.use('/mockvideos', express.static(path.join('../dream11/CricketShotClassification/allclips')));
app.use('/highlights', express.static(path.join('public/final_videos')));
app.use('/', video);
app.use("/auth", auth);
app.use("/", player);
app.use("/", series);
app.use("/admin", checkloggedinuser, admin)
app.use("/payment", checkloggedinuser, payments);
app.use("/crypto", checkloggedinuser, cryptoPaymentController);
app.use("/cryptocontest", checkloggedinuser, cryptoContestController);
app.use("/", checkloggedinuser, home);
app.use("/", checkloggedinuser, contest);
app.use("/", checkloggedinuser, teamdata);
app.use("/", checkloggedinuser, team);
app.use("/apikeys", checkloggedinuser, apikeys);
app.use("/", checkloggedinuser, updatedata);
app.use("/api/match", checkloggedinuser, matches);
app.use("/api/config", configRoutes);
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

cronjobs()
// createDefaultContestTypes()
// updateBalls();
// addMatchtoDb();
// addLiveDetails();
// addLivePlayers();
// addLivescoresDetails();
// addMatchIds();
// addTeamstandingstodb();
// addteamPlayers();
// addTeamstandingstodbAPI();
// addPlayersAPI();
// startTransaction();
// addLivecommentary();
// addLivecommentaryCustom('odi')
// addLivescoresDetailsCustom('t20')
// addLivescoresDetailsCustomfs('t20')
// updateBalls();
// addInPlayStatus();
// startCryptoTransaction();
// updateSeries()
// updateSquads()
// generateShotTypes()
// fetchAndSaveTeams();
// addMatchesForAllCurrentSeries()
// addLiveDetailsFS()
// updateSeriesArchives()
// addMissingPlayers()
// addInPlayStatusFS()


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
