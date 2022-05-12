const Matches = require('../models/match');
const LiveMatches = require('../models/match_live_details');
const flagURLs = require('country-flags-svg');
var express = require('express')
const router = express.Router()

router.post('/postanswer',async (req, res)=>{
    const matches=await Matches.find()
    res.status(200).json({
        data:matches
      });
})

module.exports = router;
