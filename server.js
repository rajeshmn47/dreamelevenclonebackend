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
const livescore = require("./controllers/addlivescoresdetails");
const teamstandings = require("./controllers/updateteam");
const comment = require("./controllers/addCommentary");
const addIds = require("./controllers/addMatchIds");
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
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.warn(`App listening on http://localhost:${PORT}`);
});
