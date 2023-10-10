const User = require("./models/user");

module.exports.getkeys = async function () {
  let totalhits = 0;
  if (totalhits > 5000) {
    totalhits = 0;
  }
  const date = new Date().getDate();
  console.log(totalhits, "totalhits");
  const keyindex = Math.floor(date / 2);
  const keyi = Math.floor(totalhits / 250);
  console.log(keyi, process.env.crickeys, process.env.apikeys, "index");
  console.log(process.env.apikeys.split(","));
  const keys = process.env.apikeys
    .replace(/(\r\n|\n|\r)/gm, "")
    .replace(/ /g, "")
    .split(",");
  return keys[keyi];
};
