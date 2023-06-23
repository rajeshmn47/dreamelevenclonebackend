const data = require("./../flags.json");
const flagURLs = require("country-flags-svg");

module.exports.getflag = function (teamname) {
  let flag = data.flags.find(
    (t) => t.teamname.toLowerCase() == teamname.toLowerCase()
  );
  if (flag) {
    return flag.flag;
  } else {
    let team = teamname.split(" A").join("").split(" women").join("");
    console.log(team);
    flagurl = flagURLs.findFlagUrlByCountryName(team);
    if (flagurl) {
      return flagurl;
    } else {
      return "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
  }
};
