module.exports.squadkeys = async function () {
  const keys=process.env.squadkeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  const keyi = Math.floor(Math.floor(new Date().getHours())/4);
  return keys[keyi];
};