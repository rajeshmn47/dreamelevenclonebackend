module.exports.isInPlay = function isInPlay(r, date) {
    let result = r.toLowerCase()
    console.log(date, r, 're')
    if (result == 'upcoming') {
        if (new Date() > new Date(date)) {
            console.log(date, r, 'r')
            return false;
        }
        else {
            return true;
        }
    }
    let isinplay = result === "stumps" ? false : result === "abandon" ? false : result == 'innings break' ? false : result == 'delay' ? false : result == 'lunch' ? false : true
    return isinplay;
}