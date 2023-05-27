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
const contest = require("./controllers/getcontests");
const teamdata = require("./controllers/getplayerscontroller");
const auth = require("./controllers/user_controller");
const team = require("./controllers/teamcontroller");
const teamstandings = require("./controllers/updateteam");
const addIds = require("./controllers/addMatchIds");
const transaction = require("./controllers/transaction");
const payments = require("./controllers/payment");
const teamstandingsA = require("./controllers/updatestandings");
const updatedata = require("./controllers/updatedata");
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
app.use("/payment", payments);
app.use("/auth", auth);
const uri =
  "mongodb+srv://rajeshmn47:uni1ver%40se@cluster0.bpxam.mongodb.net/mydreamDatabaseSecondnavya?retryWrites=true&w=majority";
mongoose.Promise = global.Promise;
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error) => {
    if (error) {
      console.log(`Error!${error}`);
    }
  }
);
const api_key =
  "s16rcBDzWjgNhJXPEUV9HA3QMSfvpen2GyL7a4F8ubdwICk5KOHPT32vI5b6cSxs8JpUhirCOjqogGwk";
async function add() {
  await everydayboy.addLivematchtodb();
}
async function addmore() {
  await eva.addLivematchtodb();
}
const date = new Date();
console.log(date.getHours(), "hours");
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
  console.log(data,'keys');
}
gettingkeys();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
