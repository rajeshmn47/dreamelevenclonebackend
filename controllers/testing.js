const Match = require("../models/match");
const request = require("request");
const axios = require("axios");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const Team = require("../models/team");

async function getnames() {
  let players = await Contest.find();
  return players;
}
(async () => {
  let o = await getnames();
  console.log(o);
})();
