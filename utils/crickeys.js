const ApiRequest = require("../models/apiRequest");
const Config = require("../models/config");
const RapidApiKey = require("../models/rapidapikeys");
const User = require("../models/user");

module.exports.getkeys = async function (matchId) {
  //console.log(keys, keyi, 'keyies')
  const key = await RapidApiKey.findOne({ type: 'scores', status: 'active' })
  if(key){
  await ApiRequest.create({
    matchId: matchId,     // Cricbuzz matchId
    apiKey: key.apiKey
  })
}
  return key?.apiKey
};
