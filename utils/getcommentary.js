module.exports.getcommentary = function (old, current) {
    let l = current.length;
    let lastball = current[l-1];
    let d = old.length;
    let oldlastball = old[d-1];
    let u=current.filter((c)=>c.ballNbr>oldlastball?.ballNbr)
    let x=old.filter((o)=>o.ballNbr<lastball?.ballNbr)
    console.log(x)
    x.push(...u)
    console.log(x,'x')
    return x;
  };
  