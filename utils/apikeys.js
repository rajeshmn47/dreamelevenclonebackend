module.exports.getkeys = async function () {
  const keys=process.env.apikeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  const keyi = Math.floor(Math.floor(new Date().getHours())/12);
  return keys[keyi];
};