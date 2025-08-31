module.exports.matchkeys = async function () {
  const keys=process.env.apikeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  const keyi = Math.floor(Math.floor(new Date().getHours())/8);
  return keys[keyi];
};