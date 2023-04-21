const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details_new");
const cheerio = require("cheerio");
const axios = require("axios");
const request = require("request");
const pretty = require("pretty");
const Result = require("../models/results")
const fs = require("fs");
const Players = require("../models/players");
const flagURLs = require("country-flags-svg");
var express = require("express");
const router = express.Router();
const everydayboys = require("./addlivescores");
const Match = require("../models/match");
const Team = require("../models/team");
const User = require("../models/user");
const Contest = require("../models/contest");
const MatchLiveDetails = require("../models/match_live_details_new");

router.get("/home/:userid", async (req, res) => {
  let stime = new Date().getSeconds();
  console.log(req.params.userid, "userid");
  let upcomingMatches = {
    results: [],
  };
  let completedMatches = {
    results: [],
  };
  let liveMatches = {
    results: [],
  };
  let userMatches = [];
  let userMatchesDetails = {
    results: [],
  };
  const user = await User.findOne({ id: req.params.id });
  console.log(user, "user");
  for (let i = 0; i < user.matchIds.length; i++) {
    let match = await Matches.findOne({ matchId: user.matchIds[i] });
    let match_det = await LiveMatches.findOne({ matchId: user.matchIds[i] });

    if (match_det) {
      let teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamHomeName
      );
      let teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamAwayName
      );
      if (!teamAwayFlagUrl) {
        teamAwayFlagUrl =
          "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
      }
      if (!teamHomeFlagUrl) {
        teamHomeFlagUrl =
          "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
      }
      let mat = {
        match_title: match.matchTitle,
        home: {
          name: match.teamHomeName,
          code: match.teamHomeCode.toUpperCase(),
        },
        away: {
          name: match.teamAwayName,
          code: match.teamAwayCode.toUpperCase(),
        },
        date: match.date,
        id: match.matchId,
        livestatus: "",
        result: "",
        status: "",
        inPlay: "",
        teamHomeFlagUrl: teamHomeFlagUrl,
        teamAwayFlagUrl: teamAwayFlagUrl,
      };
      mat.status = match_det.status;
      mat.inPlay = match_det.inPlay;
      liveStatus = "Line-ups are out!";
      mat.livestatus = liveStatus;
      let contests = [];
      let teams = [];
      if (match_det.result == "No") {
        if (match_det.status) {
          mat.livestatus = match_det.status;
        }
        mat.result = "No";
      } else {
        if (req.params.userid) {
          contests = await Contest.find({
            userIds: req.params.userid,
            matchId: match.matchId,
          });
          teams = await Team.find({
            $and: [{ matchId: match.matchId }, { userId: req.params.userid }],
          });
        }
        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          mat.result = "Yes";
          userMatchesDetails.results.push(mat);
        }
      }
    }
  }
  let date = new Date();
  date.setDate(date.getDate() - 2);
  let startDate = date.toISOString();
  date.setDate(date.getDate() + 4);
  let endDate = date.toISOString();
  let matches = await Matches.find({
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  });
  console.log(matches, "mathes");
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    let match = matches[i];
    let mat = {
      match_title: match.matchTitle,
      home: {
        name: match.teamHomeName,
        code: match.teamHomeCode.toUpperCase(),
      },
      away: {
        name: match.teamAwayName,
        code: match.teamAwayCode.toUpperCase(),
      },
      date: match.date,
      id: match.matchId,
      livestatus: "",
      result: "",
      status: "",
      inPlay: "",
      lineups: "",
      teamHomeFlagUrl: teamHomeFlagUrl,
      teamAwayFlagUrl: teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    var matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
    let contests = [];
    let teams = [];
    if (matt) {
      if (matt.result == "No" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        if (!(matt.inPlay == "Yes") && matt?.teamHomePlayers?.length > 0) {
          upcomingMatches.results.push(mat);
          mat.lineups = "Lineups Out";
        } else {
          mat.result = "No";
          mat.lineups = "Lineups Out";
          if (req.params.userid) {
            contests = await Contest.find({
              userIds: req.params.userid,
              matchId: matches[i].matchId,
            });
            teams = await Team.find({
              $and: [
                { matchId: matches[i].matchId },
                { userId: req.params.userid },
              ],
            });
          }
          if (contests.length > 0 || teams.length > 0) {
            mat.contests = contests;
            mat.teams = teams;
            liveMatches.results.push(mat);
          }
        }
      } else {
        mat.result = "Yes";
      }
    } else {
      if (matt?.teamHomePlayers?.length > 0) {
        mat.lineups = "Lineups Out";
      }
      upcomingMatches.results.push(mat);
    }
  }
  const etime = new Date().getSeconds();
  console.log(etime - stime, "totlal time");
  res.status(200).json({
    upcoming: upcomingMatches,
    past: userMatchesDetails,
    live: liveMatches,
    new: matches,
    usermatch: userMatchesDetails,
  });
});

router.get("/completed/:userid", async (req, res) => {
  let stime = new Date().getSeconds();
  console.log(req.params.userid, "userid");
  let completedMatches = {
    results: [],
  };
  let date = new Date();
  date.setDate(date.getDate() - 1);
  let startDate = date.toISOString();
  date.setDate(date.getDate() + 6);
  let endDate = date.toISOString();
  let matches = await Matches.find();
  console.log(matches, "mathes");
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl =
        "https://i.pinimg.com/originals/1b/56/5b/1b565bb93bbc6968be498ccb00504e8f.jpg";
    }
    let match = matches[i];
    let mat = {
      match_title: match.matchTitle,
      home: {
        name: match.teamHomeName,
        code: match.teamHomeCode.toUpperCase(),
      },
      away: {
        name: match.teamAwayName,
        code: match.teamAwayCode.toUpperCase(),
      },
      date: match.date,
      id: match.matchId,
      livestatus: "",
      result: "",
      status: "",
      inPlay: "",
      lineups: "",
      teamHomeFlagUrl: teamHomeFlagUrl,
      teamAwayFlagUrl: teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    var matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
    let contests = [];
    let teams = [];
    if (matt && matt.inPlay == "Yes") {
      mat.result = "Yes";
      if (req.params.userid) {
        contests = await Contest.find({
          userIds: req.params.userid,
          matchId: matches[i].matchId,
        });
        teams = await Team.find({
          $and: [
            { matchId: matches[i].matchId },
            { userId: req.params.userid },
          ],
        });
      }
    }
    if (contests.length > 0 || teams.length > 0) {
      mat.contests = contests;
      mat.teams = teams;
      completedMatches.results.push(mat);
    }
  }
  const etime = new Date().getSeconds();
  console.log(etime - stime, "totlal time");
  res.status(200).json({
    completed: completedMatches,
  });
});

router.get("/getmatch/:id", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.id });
  res.status(200).json({
    match: match,
  });
});

router.get("/getmatchlive/:id", async (req, res) => {
  const match = await MatchLiveDetails.findOne({ matchId: req.params.id });
  console.log("masthhudgi", match);
  res.status(200).json({
    match: match,
  });
});

router.get("/userdata", async(req, res) => {
const results = [];
result_url = "https://karresults.nic.in/slakresfirst.asp";
for (let i = 662460; i < 712225; i++) {
  let name;
  let regno;
  let total;
  data = { reg: i, ddlsub: "S" };
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    url: result_url,
    body: `frmpuc_tokens=0.7482416&reg=${i}&ddlsub=S`,
  };
  let dom;
  let promise = new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      }
      // console.log(body)
      resolve(body);
    });
  });

  promise
    .then(async (s) => {
      $ = cheerio.load(`${s}`);
      const tableh = $("tr");
      const listItems = $("tr");
      console.log(listItems.length); // 2
      listItems.each(function (idx, el) {
        if (idx == 0) {
          name = $(el)
            .text()
            .split("Name")[1]
            .split("\n")
            .join("")
            .split(" ")
            .join("");
          fs.appendFile(
            "data.txt",
            $(el).text().split("Name")[1].split("\n").join(""),
            function (err) {
              if (err) throw err;
            }
          );
          console.log($(el).text().split("Name")[1].split("\n").join(""));
        }
        if (idx == 1) {
          regno = $(el)
            .text()
            .split("Reg. No.")[1]
            .split("\n")
            .join("")
            .split(" ")
            .join("");
          fs.appendFile(
            "data.txt",
            $(el).text().split("Reg. No.")[1].split("\n").join(""),
            function (err) {
              if (err) throw err;
            }
          );
          console.log($(el).text().split("Reg. No.")[1].split("\n").join(""));
        }
        if (idx == 13) {
          total = $(el)
            .text()
            .split("TOTAL OBTAINED MARKS")[1]
            .split("\n")
            .join("")
            .split(" ")
            .join("")
            .split("\t")
            .join("");
          fs.appendFile(
            "data.txt",
            $(el).text().split("TOTAL OBTAINED MARKS")[1].split("\n").join(""),
            function (err) {
              if (err) throw err;
            }
          );
          console.log(
            $(el).text().split("TOTAL OBTAINED MARKS")[1].split("\n").join("")
          );
        }
        console.log(idx, $(el).text());

        if (name && regno && total) {
          results.push({ name: name, regno: regno, total: total });
          name = -3;
          regno = -4;
          total = -8;
        }
      });
    if(results.length>20000){
      let rest=results.filter((r)=>!(r.name=='-3'))
      function compare( a, b ) {
        if ( a.last_nom < b.last_nom ){
          return -1;
        }
        if ( a.last_nom > b.last_nom ){
          return 1;
        }
        return 0;
      }
      let iss=rest.sort(compare)
        res.status(200).json({
        users: iss,
      });
    }   
})
    .catch((err) => {
      console.log("Error : " + err);
    });

}   

});

router.get("/results", async(req, res) => {
  const results = [];
  result_url = "https://karresults.nic.in/slakresfirst.asp";
  for (let i = 662460; i < 712225; i++){
    let name;
    let regno;
    let total;
    data = { reg: i, ddlsub: "S" };
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      url: result_url,
      body: `frmpuc_tokens=0.7482416&reg=${i}&ddlsub=S`,
    };
    let dom;
    let promise = new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        }
        // console.log(body)
        resolve(body);
      });
    });
  
    promise
      .then(async (s) => {
        $ = cheerio.load(`${s}`);
        const tableh = $("tr");
        const listItems = $("tr");
        console.log(listItems.length); // 2
        listItems.each(function (idx, el) {
          if (idx == 0) {
            name = $(el)
              .text()
              .split("Name")[1]
              .split("\n")
              .join("")
              .split(" ")
              .join("");
            fs.appendFile(
              "data.txt",
              $(el).text().split("Name")[1].split("\n").join(""),
              function (err) {
                if (err) throw err;
              }
            );
            console.log($(el).text().split("Name")[1].split("\n").join(""));
          }
          if (idx == 1) {
            regno = $(el)
              .text()
              .split("Reg. No.")[1]
              .split("\n")
              .join("")
              .split(" ")
              .join("");
            fs.appendFile(
              "data.txt",
              $(el).text().split("Reg. No.")[1].split("\n").join(""),
              function (err) {
                if (err) throw err;
              }
            );
            console.log($(el).text().split("Reg. No.")[1].split("\n").join(""));
          }
          if (idx == 13) {
            total = $(el)
              .text()
              .split("TOTAL OBTAINED MARKS")[1]
              .split("\n")
              .join("")
              .split(" ")
              .join("")
              .split("\t")
              .join("");
            fs.appendFile(
              "data.txt",
              $(el).text().split("TOTAL OBTAINED MARKS")[1].split("\n").join(""),
              function (err) {
                if (err) throw err;
              }
            );
            console.log(
              $(el).text().split("TOTAL OBTAINED MARKS")[1].split("\n").join("")
            );
          }
          console.log(idx, $(el).text());
  
          if (name && regno && total) {
            results.push({ name: name, regno: regno, total: total });
            name = -3;
            regno = -4;
            total = -8;
          }
        });
      if(i>712210){
        let rest=results.filter((r)=>!(r.name=='-3'))
        function compare( a, b ) {
          if ( a.name < b.name ){
            return -1;
          }
          if ( a.name > b.name ){
            return 1;
          }
          return 0;
        }
        let iss=rest.sort(compare)
        for(let x=0;x<iss.length;x++){
          const a=new Result()
          a.name=iss[x].name
          a.regno=iss[x].regno
          a.total=iss[x].total
          await  a.save()
        }
        
          res.status(200).json({
          users: iss,
        });
      }   
  })
      .catch((err) => {
        console.log("Error : " + err);
      });
  
  }   
  });

  router.get("/getallresults", async (req, res) => {
    const results = await Result.find()
    res.status(200).json({
      message: "got all results successfully",
      data: results,
    });
  });
  

module.exports = router;
