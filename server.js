var express = require("express");
var app = express();
const mongoose = require("mongoose");
const cors = require("cors");
var express = require("express");
const cricLive = require("cric-live");
const home = require("./controllers/homecontroller");
const contest = require("./controllers/getcontests");
const teamdata = require("./controllers/getplayerscontroller");
const auth = require("./controllers/user_controller");
const everyday = require("./controllers/matchDB-controller");
const everydayboy = require("./controllers/addlivedetailsnew");
const eva = require("./controllers/updatestandings");
const evas = require("./controllers/updateteam");
const team = require("./controllers/teamcontroller");
/* Requiring body-parser package
to fetch the data that is entered
by the user in the HTML form.*/
const bodyParser = require("body-parser");
// Allowing app to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const url = "http://localhost:3000";
const krl = "https://stackoverflowclonefrontend.netlify.app";
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
async function everydaybro() {
  await everydayboy.addLivematchtodb();
}
async function everydayguy() {
  await evas.addTeamstandingstodb();
}
everydaybro();
k = Buffer.from("jwalagutta", "base64").toString();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(k);
  console.warn(`App listening on http://localhost:${PORT}`);
});
