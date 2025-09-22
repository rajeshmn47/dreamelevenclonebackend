module.exports.getcommentary = function (old, current, innings) {
  if (innings == 1) {
    current = current.sort((a, b) => b.timestamp - a.timestamp)
  }
  else {
    current = current.sort((a, b) => b.timestamp - a.timestamp)
  }
  let cur = current.filter((c) => c.ballNbr > 0);
  let older = [];
  if (innings == 1) {
    older = old.sort((a, b) => b.timestamp - a.timestamp);
  }
  else {
    older = old.sort((a, b) => b.timestamp - a.timestamp);
  }
  let l = cur.length;
  let lastball = current[0];
  let d = older.length;
  older = older.filter((o) => o.ballNbr > 0);
  let oldlastball = older[0]
  if (oldlastball?.ballNbr || parseInt(oldlastball?.ballNbr) == 0) {
    let u = cur.filter((c) => c.timestamp > oldlastball?.timestamp);
    let x = older.filter((o) => o.timestamp < lastball?.timestamp);
    console.log(older?.map((o) => o.videoLink), (cur?.map((c) => c.ballNbr)), u.length, x.length, 'x')
    x.push(...u);
    let commentary = [];
    if (Array.isArray(x)) {
      commentary.push(...x)
      if (Array.isArray(lastball)) {
        commentary.push(...u)
      }
    }

    const seen = new Set();
    const uniqueByOver = [];

    for (let i = commentary.length - 1; i >= 0; i--) {
      const item = commentary[i];
      const over = item.overNumber;
      if (!seen.has(over)) {
        seen.add(over);
        uniqueByOver.unshift(item);  // keep latest one (from end)
      }
    }

    return uniqueByOver;
  } else {
    if (Array.isArray(cur)) {
      console.log(cur?.length, 'currenty')
      return cur;
    }
    else {
      //console.log(older, 'old')
      const seen = new Set();
      const uniqueByOver = [];

      for (let i = older.length - 1; i >= 0; i--) {
        const item = older[i];
        const over = item.overNumber;
        if (!seen.has(over)) {
          seen.add(over);
          uniqueByOver.unshift(item);  // keep latest one (from end)
        }
      }

      return uniqueByOver;
      //return older;
    }
  }
};
