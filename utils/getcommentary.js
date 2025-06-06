module.exports.getcommentary = function (old, current) {
  let cur = current;
  let older = old.reverse();
  let l = cur.length;
  let lastball = current[l - 1];
  let d = older.length;
  let oldlastball = older[d - 1];
  console.log(lastball, l, 'oldlastball')
  if (oldlastball?.ballNbr || parseInt(oldlastball?.ballNbr) == 0) {
    let u = cur.filter((c) => c.timestamp > oldlastball?.timestamp);
    let x = older.filter((o) => o.timestamp < lastball?.timestamp);
    //console.log(x?.length, u?.length, oldlastball, 'x')
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
