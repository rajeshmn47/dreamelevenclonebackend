const flagURLs = require("country-flags-svg");
const data = require('./flags.json');

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
  return 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_(Pantone).svg';
};
