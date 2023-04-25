const Matches = require("../models/match");
const LiveMatches = require("../models/match_live_details_new");
const cheerio = require("cheerio");
const axios = require("axios");
const request = require("request");
const pretty = require("pretty");
var randomname = require("random-indian-name");
const createMobilePhoneNumber = require("random-mobile-numbers");
var randomEmail = require("random-email");
const Result = require("../models/results");
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
const Player = require("../models/players");

router.get("/home/:userid", async (req, res) => {
  let stime = new Date().getSeconds();
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
  const user = await User.findOne({ _id: req.params.userid });
  console.log(user, "ids", req.params.userid);
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
          console.log("finding", req.params.userid, match_det.matchId);
          console.log("no result", match_det.result);
          let teams = await Team.find({
            $and: [
              { matchId: match_det.matchId },
              { userId: req.params.userid },
            ],
          });
          contests = await Contest.find({
            userIds: req.params.userid,
            matchId: match_det.matchId,
          });
          console.log(teams, "teams");
          if (teams.length > 0) {
            mat.contests = contests;
            mat.teams = teams;
            mat.result = "Yes";
            completedMatches.results.push(mat);
            userMatchesDetails.results.push(mat);
          }
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
            teams = await Team.find({
              $and: [
                { matchId: matches[i].matchId },
                { userId: req.params.userid },
              ],
            });
            contests = await Contest.find({
              userIds: req.params.userid,
              matchId: matches[i].matchId,
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
  let completedMatches = {
    results: [],
  };
  let date = new Date();
  date.setDate(date.getDate() - 1);
  let startDate = date.toISOString();
  date.setDate(date.getDate() + 6);
  let endDate = date.toISOString();
  let matches = await Matches.find();
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

router.get("/results", async (req, res) => {
  const results = [];
  result_url = "https://karresults.nic.in/slakresfirst.asp";
  for (let i = 800000; i < 900000; i++) {
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
        const listItems = $("tr"); // 2
        listItems.each(function (idx, el) {
          if (idx == 0) {
            name = $(el)
              .text()
              .split("Name")[1]
              .split("\n")
              .join("")
              .split(" ")
              .join("");
            console.log(name, "name");
            console.log(i, "studentno");
          }
          if (idx == 1) {
            regno = $(el)
              .text()
              .split("Reg. No.")[1]
              .split("\n")
              .join("")
              .split(" ")
              .join("");
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
          }

          if (name && regno && total) {
            results.push({ name: name, regno: regno, total: total });
            name = -3;
            regno = -4;
            total = -8;
          }
        });
        if (i > 899998) {
          let rest = results.filter((r) => !(r.name == "-3"));
          function compare(a, b) {
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          }
          let iss = rest.sort(compare);
          console.log(iss, "iss");
          await Result.insertMany(iss);
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

router.get("/getallresults/:name", async (req, res) => {
  const results = await Result.find({ name: { $regex: req.params.name } });
  if (results) {
    res.status(200).json({
      message: "got all results successfully",
      data: results,
      length: results.length,
    });
  } else {
    res.status(200).json({
      message: "got all results successfully",
      data: [],
      length: 0,
    });
  }
});

router.get("/getallresults", async (req, res) => {
  const results = await Result.find();
  if (results) {
    res.status(200).json({
      message: "got all results successfully",
      data: results,
      length: results.length,
    });
  } else {
    res.status(200).json({
      message: "got all results successfully",
      data: [],
      length: 0,
    });
  }
});

router.get("/getallusers", async (req, res) => {
  const users = await User.find();
  if (users.length > 0) {
    res.status(200).json({
      message: "got all results successfully",
      data: users,
      length: users.length,
    });
  } else {
    res.status(200).json({
      message: "got all results successfully",
      data: [],
      length: 0,
    });
  }
});

router.get("/postpro", async (req, res) => {
  times_url =
    "https://exedadmin.timespro.com/SalesForceAPI/insertLeadreact.php";
  for (let i = 0; i < 500; i++) {
    let name = randomname().split(" ").join("");
    let mail = name + "@gmail.com";
    let data = {
      name: name,
      phone: createMobilePhoneNumber("TR").split("+90").join(""),
      email: mail,
      legal: true,
      marketingConsent: true,
      country_code: "+91",
      url: "https://timespro.com/web3/about",
    };
    let deta = {
      cityName: "chennai",
      companyName: "infosys",
      country_code: "+91",
      course_id: "P-00307",
      designationName: "aso",
      email: mail,
      exp: "0-2 years",
      first_name: name,
      interested_module: "",
      last_name: "",
      legal: true,
      marketingConsent: true,
      message: "i want some new information",
      phone_number: createMobilePhoneNumber("TR").split("+90").join(""),
      sf_course_name:
        "XLRI_Post_Graduate_Certi?cate_in_Human_Resource_Management_33",
      state: "Tamil Nadu",
      url: "https://timespro.com/executive-education/xlri-jamshedpur-post-graduate-certificate-in-human-resource-management",
    };
    let url = times_url;
    const d = await axios.post(url, deta);
    console.log(name, mail, "name");
    console.log(d.data, "dr");
    console.log(i, "i");
  }
  res.status(200).json({
    message: "got all results successfully",
    data: [],
    length: 0,
  });
});

router.get("/projest", async (req, res) => {
  times_url =
    "https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel?VER=8&database=projects/projest-290c8/databases/(default)&gsessionid=NQz4c9E5Y4fbVKPnR97tQJ-nQDxsxigwZU7kZ3QkTjs&SID=xQ1L2Luc_fR0sp46TTWZZw&RID=54914&AID=1&zx=5egzy87r60km&t=1";
  for (let i = 0; i < 500; i++) {
    let data = `headers=X-Goog-Api-Client%3Agl-js%2F%20fire%2F9.18.0%0D%0AContent-Type%3Atext%2Fplain%0D%0AX-Firebase-GMPID%3A1%3A661303131310%3Aweb%3Aabd56b2d2b2749706f813f%0D%0A&count=1&ofs=0&req0___data__=%7B%22database%22%3A%22projects%2Fprojest-290c8%2Fdatabases%2F(default)%22%2C%22addTarget%22%3A%7B%22query%22%3A%7B%22structuredQuery%22%3A%7B%22from%22%3A%5B%7B%22collectionId%22%3A%22projects%22%7D%5D%2C%22orderBy%22%3A%5B%7B%22field%22%3A%7B%22fieldPath%22%3A%22__name__%22%7D%2C%22direction%22%3A%22ASCENDING%22%7D%5D%7D%2C%22parent%22%3A%22projects%2Fprojest-290c8%2Fdatabases%2F(default)%2Fdocuments%22%7D%2C%22targetId%22%3A2%7D%7D`;
    let url = times_url;
    const d = await axios(times_url, {
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      data: data,
    });
    console.log(i, "i");
    console.log(d, "name");
    console.log(d, "dr");
  }
  res.status(200).json({
    message: "got all results successfully",
    data: [],
    length: 0,
  });
});

router.get("/players", async (req, res) => {
  const players = await Player.find();
  let pla = [];
  players.forEach((p, index) => {
    if (!pla.find((o) => o.id == p.id)) {
      pla.push(p);
    }
  });
  function compare(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
  let ple = pla.sort(compare);

  res.status(200).json({
    message: "got all results successfully",
    data: ple,
    length: ple.length,
  });
});

module.exports = router;
