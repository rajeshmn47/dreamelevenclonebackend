const User = require("./models/user");

module.exports.getkeys = async function () {
  let user = await User.findById(process.env.refUserId);
  const totalhits = user.totalhits;
  if (totalhits > 1500) {
    user.totalhits = 0;
    await user.save();
  }
  const date = new Date().getDate();
  const keyindex = Math.floor(date / 2);
  const keyi = Math.floor(totalhits / 100);
  const keys = process.env.crickeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  return keys[keyi];
};
