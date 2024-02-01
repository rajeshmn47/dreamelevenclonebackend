const flagURLs = require("country-flags-svg");
const data = require('../flags.json');

module.exports.getflag = function (teamname) {
  const flag = data.flags.find(
    (t) => t.teamname.toLowerCase() === teamname.toLowerCase(),
  );
  if (flag) {
    return flag.flag;
  }
  const team = teamname.split(' A').join('').split(' women').join('');
  const flagurl = flagURLs.findFlagUrlByCountryName(team);
  if (flagurl) {
    return flagurl;
  }
  return 'https://c8.alamy.com/comp/WKN91Y/illustration-of-a-cricket-sports-player-batsman-batting-front-view-set-inside-shield-WKN91Y.jpg';
};
