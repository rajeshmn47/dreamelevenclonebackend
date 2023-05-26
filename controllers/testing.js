const request = require("request");
const axios = require("axios");
const Match = require("../models/match");
const Contest = require("../models/contest");
const MatchLive = require("../models/match_live_details_new");
const Player = require("../models/players");
const Team = require("../models/team");

async function getnames() {
  const players = await Contest.find();
  return players;
}
(async () => {
  const o = await getnames();
})();
