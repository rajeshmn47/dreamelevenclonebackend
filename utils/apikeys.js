const ApiRequest = require("../models/apiRequest");
const RapidApiKey = require("../models/rapidapikeys");

module.exports.squadkeys = async function (matchId) {
  const key = await RapidApiKey.findOne({ type: 'lineups', status: 'active' })
  await ApiRequest.create({
    matchId: matchId,     // Cricbuzz matchId
    apiKey: key.apiKey
  })
  return key.apiKey
};