module.exports.checklastballexists = function (commentaryarray, livelastball) {
  let l = commentaryarray.length;
  let lastball = commentaryarray[l - 1];
  if (lastball?.overNumber == livelastball?.overNumber) {
    return true;
  } else {
    return false;
  }
};
