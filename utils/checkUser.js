const jwt = require("jsonwebtoken");

module.exports.checkloggedinuser = function (req, res, next) {
    //console.log('checking')
    const tokenheader = req.body.headers || req.headers.servertoken;
    const activatekey = "accountactivatekey123";
    console.log(tokenheader, "token header");
    if (tokenheader) {
        jwt.verify(tokenheader, activatekey, (err, decoded) => {
            if (!err) {
                console.log(decoded.userid, "userid")
                req.body.uidfromtoken = decoded.userid;
            }
            console.log(err, "err");
            next();
        });
    } else {
        res.status(400).json({
            success: false,
            message: "not authenticated"
        });
    }
}

module.exports.checkloggedinadmin = async function (req, res, next) {
    //console.log('checking')
    const tokenheader = req.body.headers || req.headers.servertoken;
    const activatekey = "accountactivatekey123";
    if (tokenheader) {
        jwt.verify(tokenheader, activatekey, async (err, decoded) => {
            if (!err) {
                const user = await User.findById(decoded.userid);
                if (user.role.toLowerCase() !== "admin") {
                    return res.status(403).json({
                        success: false, message: "forbidden"
                    })
                }
                req.body.uidfromtoken = decoded.userid;
            }
            next();
        });
    } else {
        res.status(400).json({
            success: false,
            message: "not authenticated"
        });
    }
}