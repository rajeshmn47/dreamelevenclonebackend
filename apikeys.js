module.exports.getkeys = async function () {
  const keys=process.env.apikeys.replace(/(\r\n|\n|\r)/gm, "").replace(/ /g, "")
  .split(",");
  console.log(keys,'apikeys')
  const keyi = Math.floor(Math.floor(new Date().getHours())/12);
  console.log(keyi,keys[keyi],"index");
  return keys[keyi];
};