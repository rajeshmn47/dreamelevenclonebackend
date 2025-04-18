const flagURLs = require("country-flags-svg");
const data = require('./flags.json');

module.exports.getflag = function (teamname) {
  //const flag = data.flags.find(
  // (t) => t.teamname.toLowerCase() === teamname.toLowerCase(),
  //);
  let flag;
  //console.log(flag, teamname)
  if (flag) {
    return flag.flag;
  }
  const team = teamname.split(' A').join('').split(' women').join('').split(' a').join('').split(' masters').join('')
  console.log(team, 'team')
  const flagUrl = data.flags.find(
    (t) => t.teamname.toLowerCase() === team.toLowerCase(),
  );
  if (flagUrl) {
    //console.log(flagUrl, teamname,'rajesh')
    return flagUrl.flag
  }
  else {
    const team = teamname.split(' A').join('').split(' women').join('').split(' masters').join('')
    console.log(team, 'team')
    const flagUrl = data.flags.find(
      (t) => t.teamname.toLowerCase() === team.toLowerCase(),
    );
    if (flagUrl) {
      //console.log(flagUrl, teamname,'rajesh')
      return flagUrl.flag
    }
    return "data:image/png;base64,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";
  }
};
