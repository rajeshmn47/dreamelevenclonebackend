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
      return "https://c8.alamy.com/comp/WKN91Y/illustration-of-a-cricket-sports-player-batsman-batting-front-view-set-inside-shield-WKN91Y.jpg";
    }
  }
};
