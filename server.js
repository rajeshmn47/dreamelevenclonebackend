require("dotenv").config();
var express = require("express");
var app = express();
const mongoose = require("mongoose");
const cors = require("cors");
var express = require("express");
const cricLive = require("cric-live");
var cron = require("node-cron");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
const home = require("./controllers/homecontroller");
const contest = require("./controllers/getcontests");
const teamdata = require("./controllers/getplayerscontroller");
const auth = require("./controllers/user_controller");
const team = require("./controllers/teamcontroller");
const matches = require("./controllers/matchDB-controller");
const livedetails = require("./controllers/addlivedetailsnew");
const addplayers = require("./controllers/addplayerstwo");
const livescore = require("./controllers/addlivescoresdetails");
const teamstandings = require("./controllers/updateteam");
const comment = require("./controllers/addCommentary");
const addIds = require("./controllers/addMatchIds");
const transaction = require("./controllers/transaction");
const payments = require("./controllers/payment");
const teamstandingsA = require("./controllers/updatestandings");
// Environment variables
/* Requiring body-parser package
to fetch the data that is entered
by the user in the HTML form.*/
const bodyParser = require("body-parser");
// Allowing app to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", credentials: false }));
app.use("/", home);
app.use("/", contest);
app.use("/", teamdata);
app.use("/", team);
app.use("/payment", payments);
app.use("/auth", auth);
const uri =
  "mongodb+srv://rajeshmn47:uni1ver%40se@cluster0.bpxam.mongodb.net/mydreamDatabaseSecond?retryWrites=true&w=majority";
mongoose.Promise = global.Promise;
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (error) {
    if (error) {
      console.log("Error!" + error);
    }
  }
);
let api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
async function add() {
  await everydayboy.addLivematchtodb();
}
async function addmore() {
  await eva.addLivematchtodb();
}
let date = new Date();
//livedetails.addLivematchtodb();
livescore.addLivematchtodb();
//addIds.addMatchIds();
//teamstandings.addTeamstandingstodb();
//matches.addMatchtoDb()
//teamstandingsA.addTeamstandingstodb()
//addplayers.addPlayers();
//transaction.startTransaction();
cron.schedule(
  "05 12 * * *",
  function () {
    //add();
  },
  null,
  true,
  "America/Los_Angeles"
);
cron.schedule(
  "*/28 * * * *",
  function () {
    console.log(new Date().getHours(), new Date().getMinutes(), "hours");
    //livedetails.addLivematchtodb();
    //livescore.addLivematchtodb();
    //teamstandings.addTeamstandingstodb(); //addmore();
  },
  null,
  true,
  "America/Los_Angeles"
);

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
