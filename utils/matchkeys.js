module.exports.matchkeys = async function () {
  const keys=process.env.apikeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  console.log(keys, 'keys')
  const keyi = Math.floor(Math.floor(new Date().getHours())/12);
  console.log(keyi, 'keyi')
  return keys[keyi];
};