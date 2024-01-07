const User = require("./models/user");

module.exports.getkeys = async function () {
  let user = await User.findById(process.env.refUserId);
  const totalhits = user.totalhits;
  if (totalhits > 1500) {
    user.totalhits = 0;
    await user.save();
  }
  const date = new Date().getDate();
  console.log(totalhits, "totalhits");
  const keyindex = Math.floor(date / 2);
  const keyi = Math.floor(totalhits / 100);
  console.log(keyi, process.env.crickeys, process.env.apikeys, "index");
  const keys = process.env.crickeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  console.log(keys[keyi], keys, "mykey");
  return keys[keyi];
};
