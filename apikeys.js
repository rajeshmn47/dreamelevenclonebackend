const User = require("./models/user");

module.exports.getkeys = async function () {
  let totalhits = 0;
  if (totalhits > 5000) {
    totalhits = 0;
  }
  const date = new Date().getDate();
  const keyindex = Math.floor(date / 2);
  const keyi = Math.floor(totalhits / 250);
  const keys = process.env.apikeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  return keys[keyi];
};
