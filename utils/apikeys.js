module.exports.getkeys = async function () {
  const keys=process.env.squadkeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  const keyi = Math.floor(Math.floor(new Date().getHours())/8);
  return keys[keyi];
};