const jwt = require("jsonwebtoken");

module.exports.checkloggedinuser = function (req, res, next) {
    const tokenheader = req.body.headers || req.headers.servertoken;
    const activatekey = "accountactivatekey123";
    if (tokenheader) {
        jwt.verify(tokenheader, activatekey, (err, decoded) => {
            if (!err) {
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