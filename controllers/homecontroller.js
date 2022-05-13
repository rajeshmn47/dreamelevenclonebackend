const Matches = require('../models/match');
const LiveMatches = require('../models/match_live_details');
const flagURLs = require('country-flags-svg');
var express = require('express')
const router = express.Router()

router.get('/home',async (req, res)=>{

    let upcomingMatches = {
        "results": []
    };
    let completedMatches = {
        "results": []
    };
    let liveMatches = {
        "results": []
    };
    const matches=await Matches.find()
    for(let i=0;i<matches.length;i++){
        
        console.log(matches[i])
        teamAwayFlagUrl=flagURLs.findFlagUrlByCountryName(matches[i].teamAwayName)
        teamHomeFlagUrl=flagURLs.findFlagUrlByCountryName(matches[i].teamHomeName)
        if(!teamAwayFlagUrl){
            teamAwayFlagUrl = "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
        }
        if(!teamHomeFlagUrl){
            teamHomeFlagUrl = "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
        }
        let match=matches[i]
        let mat = {
            match_title : match.matchTitle,
            home: {
                name : match.teamHomeName,
                code: match.teamHomeCode.toUpperCase()
            }, 
            away: {
                name : match.teamAwayName,
                code: match.teamAwayCode.toUpperCase()
            },
            date: match.date,
            id: match.matchId,
            livestatus : "",
            result: "",
            status: "",
            inPlay: "",
            teamHomeFlagUrl: teamHomeFlagUrl,
            teamAwayFlagUrl: teamAwayFlagUrl
        }
        
            liveStatus = "Line-ups are not out yet!";
            mat.livestatus = liveStatus;
        var matt=await LiveMatches.find({matchId:matches[i].matchId})
    if(matt){
        if(matt.result == "No" || !matt.result){
            if(matt.status){
                mat.livestatus = matt.status;
            }
            mat.result = "No";
            liveMatches.results.push(mat);
        }
        else{
            mat.result = "Yes";
            comletedMatches.results.push(mat);
        }
        
    }
    else{
        upcomingMatches.results.push(mat)
    }
    }
    console.log(matches)
    res.status(200).json({
        upcoming:upcomingMatches,
        past:completedMatches,
live:liveMatches
      });
})

module.exports = router;
