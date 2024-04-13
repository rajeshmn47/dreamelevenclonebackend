const User = require("../models/user");

module.exports.getkeys = async function () {
  let user = await User.findById(process.env.refUserId);
  const totalhits = user.totalhits;
  if (totalhits > 2000) {
    user.totalhits = 0;
    await user.save();
  }
  user.totalhits = user.totalhits + 1;
  await user.save();
  const keyi = Math.floor(totalhits / 100);
  const keys = process.env.crickeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  return keys[keyi];
};
