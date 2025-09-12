const ApiRequest = require("../models/apiRequest");
const Config = require("../models/config");
const User = require("../models/user");

module.exports.getkeys = async function (matchId) {
  let user = await User.findById(process.env.refUserId);
  const config = await Config.findOne();
  //console.log(config, 'config_file')
  const totalhits = config.totalhits;
  console.log(totalhits, 'totalhits')
  if (totalhits > 1800) {
    config.totalhits = 0;
    await config.save();
  }
  config.totalhits = config.totalhits + 1;
  //config.totalhits = 1405
  await config.save();
  const keyi = Math.floor(totalhits / 100);
  const keys = process.env.crickeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  //console.log(keys, keyi, 'keyies')
  await ApiRequest.create({
    matchId: matchId,     // Cricbuzz matchId
    apiKey: keys[keyi]
  })
  return keys[keyi];
};
