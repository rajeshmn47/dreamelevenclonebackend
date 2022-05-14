const Matches = require('../models/match');
const LiveMatches = require('../models/match_live_details');
const flagURLs = require('country-flags-svg');
var express = require('express')
const router = express.Router()
const everydayboys = require('./addlivescores')



router.get('/register',async (req, res)=>{
    console.log(req.body)

    res.status(200).json({
        'upcoming':'upcomingMatches',
      });
})