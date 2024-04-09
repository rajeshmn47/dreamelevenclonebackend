const cheerio = require("cheerio");
const axios = require("axios");
const request = require("request");
const pretty = require("pretty");
const randomname = require("random-indian-name");
const createMobilePhoneNumber = require("random-mobile-numbers");
const randomEmail = require("random-email");
const fs = require("fs");
const flagURLs = require("country-flags-svg");
const express = require("express");
const Players = require("../models/players");
const Result = require("../models/results");
const LiveMatches = require("../models/matchlive");
const FLiveMatches = require("../models/fMatchlive");
const Matches = require("../models/match");
const router = express.Router();
const Match = require("../models/match");
const FMatch = require("../models/fMatch ");
const Team = require("../models/team");
const User = require("../models/user");
const Contest = require("../models/contest");
const Player = require("../models/players");
const getflags = require("../utils/getflags");

function isToday(d1, d2) {
  return (
    d1.getUTCFullYear() == d2.getUTCFullYear() &&
    d1.getUTCMonth() == d2.getUTCMonth() &&
    d1.getUTCDate() == d2.getUTCDate()
  );
}

router.get("/myMatches", async (req, res) => {
  const notAllowed = ["", false, null, 0, undefined, NaN];
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  const stime = new Date().getSeconds();
  const completedMatches = {
    results: [],
  };
  const liveMatches = {
    results: [],
  };
  const findDate = new Date();
  const matches = await Matches.find({ matchId: { $in: [...user.matchIds] } });
  const usermatchespromises = user.matchIds.map((id) =>
    LiveMatches.findOne({ matchId: id })
  );
  const usermatchesdetails = await LiveMatches.find({
    matchId: { $in: [...user.matchIds] },
  });
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  const allusermatchesdetails = usermatchesdetails.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const teampromises = user.matchIds.map((id) =>
    Team.find({
      $and: [{ matchId: id }, { userId: req.body.uidfromtoken }],
    })
  );

  const contestpromises = user.matchIds.map((id) =>
    Contest.find({
      $and: [{ matchId: id }, { userIds: req.body.uidfromtoken }],
    })
  );
  const teamse = await Promise.all(teampromises);
  const contestse = await Promise.all(contestpromises);
  let allcontests = [];
  let allteams = [];
  contestse.forEach((c) => {
    c.forEach((k) => {
      allcontests.push(k);
    });
  });
  teamse.forEach((c) => {
    c.forEach((k) => {
      allteams.push(k);
    });
  });
  for (let i = 0; i < matches.length; i++) {
    if (user.matchIds.includes(matches[i].matchId)) {
      teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
        matches[i].teamAwayName
      );
      teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
        matches[i].teamHomeName
      );
      if (!teamAwayFlagUrl) {
        teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
      }
      if (!teamHomeFlagUrl) {
        teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
      }
      const match = matches[i];
      const mat = {
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
        won: 0,
        teamHomeFlagUrl,
        teamAwayFlagUrl,
      };
      liveStatus = "Line-ups are not out yet!";
      mat.livestatus = liveStatus;
      //const matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
      const matt = allusermatchesdetails.find(
        (m) => m.matchId == matches[i].matchId
      );
      let contests = [];
      let teams = [];
      if (matt && matt.result == "In Progress") {
        mat.result = "No";
        if (req.body.uidfromtoken) {
          let teams = allteams.filter(
            (a) => a.matchId == matt.matchId && a.userId == req.body.uidfromtoken
          );
          let contests = allcontests.filter(
            (a) =>
              a.matchId == matt.matchId && a.userIds.includes(req.body.uidfromtoken)
          );
          mat.contests = contests;
          mat.teams = teams;
          liveMatches.results.push(mat);
        }
      }
      if (req.body.uidfromtoken && matt?.result == "Complete") {
        mat.result = "Yes";
        let teams = allteams.filter(
          (a) => a.matchId == matt.matchId && a.userId == req.body.uidfromtoken
        );
        let contests = allcontests.filter(
          (a) =>
            a.matchId == matt.matchId && a.userIds.includes(req.body.uidfromtoken)
        );
        mat.contests = contests;
        mat.teams = teams;
        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          for (let i = 0; i < contests?.length; i++) {
            let totalwon = 0;
            let arr = [];
            for (let j = 0; j < contests[i]?.teamsId?.length; j++) {
              if (
                !notAllowed.includes(contests[i]?.teamsId[j]) &&
                !(contests[i]?.teamsId[j] == false)
              ) {
                try {
                  const ta = allteams.find((a) => {
                    if (contests[i]?.teamsId[j] == a._id.toString()) {
                      return true;
                    }
                  });

                  if (ta) {
                    if (!ta.points) {
                      ta.points = 44;
                    }
                    arr.push(ta);
                  }
                } catch (err) {
                  console.log(err, "err");
                }
              }
            }

            arr = arr.sort((a, b) => b?.points - a?.points);
            for (let x = 0; x < arr.length; x++) {
              if (arr[x].userId == req.query.userid) {
              }
              try {
                if (contests[i]?.prizeDetails[x]?.prize) {
                  totalwon = contests[i]?.prizeDetails[x]?.prize + totalwon;
                }
              } catch (err) {
                console.log(err, "err");
              }
            }
            mat.won = totalwon + mat.won;
          }
          completedMatches.results.push(mat);
        }
      }
    }
  }
  const upcomingMatches = {
    results: [],
  };
  const date = new Date();
  const startDate = date.toISOString();
  const umatchesdetails = await Matches.find({
    $and: [
      { matchId: { $in: [...user.matchIds] } },
      {
        date: {
          $gte: new Date(startDate)
        }
      }
    ]
  });
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  for (let i = 0; i < umatchesdetails.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      umatchesdetails[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      umatchesdetails[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = umatchesdetails[i];
    const mat = {
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
      won: 0,
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };
    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    //const matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
    const umat = umatchesdetails.find(
      (m) => m.matchId == match.matchId
    );
    let contests = [];
    let teams = [];
    if (umat) {
      mat.result = "No";
    }

    let teamse = allteams.filter(
      (a) => a.matchId == umat.matchId && a.userId == req.body.uidfromtoken
    );
    let contestse = allcontests.filter(
      (a) =>
        a.matchId == umat.matchId && a.userIds.includes(req.body.uidfromtoken)
    );
    mat.contests = contestse;
    mat.teams = teamse;
    if (contestse.length > 0 || teamse.length > 0) {
      mat.contests = contestse;
      mat.teams = teamse;
    }
    upcomingMatches.results.push(mat);
  }
  res.status(200).json({
    completed: completedMatches,
    upcoming: upcomingMatches,
    live: liveMatches
  });
});

router.get("/recentMatches", async (req, res) => {
  const notAllowed = ["", false, null, 0, undefined, NaN];
  const allMatches = {
    results: [],
  };
  let date = new Date();
  const endDate = new Date(date.getTime() + 48 * 60 * 60 * 1000);
  const starteDate = new Date(date.getTime() - 48 * 60 * 60 * 1000);
  const matches = await Match.find({
    date: {
      $gte: new Date(starteDate),
      $lt: new Date(endDate),
    },
  });
  const allLiveMatches = await LiveMatches.find({
    date: {
      $gte: new Date(starteDate),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].matchId) {
      teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
        matches[i].teamAwayName
      );
      teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
        matches[i].teamHomeName
      );
      if (!teamAwayFlagUrl) {
        teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
      }
      if (!teamHomeFlagUrl) {
        teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
      }
      const match = matches[i];
      const mat = {
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
        won: 0,
        teamHomeFlagUrl,
        teamAwayFlagUrl,
      };
      liveStatus = "Line-ups are not out yet!";
      mat.livestatus = liveStatus;
      //const matt = await LiveMatches.findOne({ matchId: matches[i].matchId });
      const matt = allLiveMatches.find(
        (m) => m.matchId == matches[i].matchId
      );
      let contests = [];
      let teams = [];
      if (matt && matt.result == "In Progress") {
        mat.result = "live";
        allMatches.results.push(mat);
      }
      else if (matt?.result == "Complete") {
        mat.result = "completed";
        mat.contests = contests;
        mat.teams = teams;
        allMatches.results.push(mat);
      }
      else if (date > new Date(mat.date)) {
        mat.result = "delayed";
        allMatches.results.push(mat)
      }
      else {
        mat.result = "upcoming";
        allMatches.results.push(mat)
      }
    }
  }
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  res.status(200).json({
    success: true,
    all: allMatches
  });
});


router.get("/getmatch/:id", async (req, res) => {
  const match = await Match.findOne({ matchId: req.params.id });
  const livematch = await LiveMatches.findOne({ matchId: req.params.id });
  teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
    match?.teamAwayName
  );
  teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
    match?.teamHomeName
  );
  if (!teamAwayFlagUrl) {
    teamAwayFlagUrl = getflags.getflag(match.teamAwayName);
  }
  if (!teamHomeFlagUrl) {
    teamHomeFlagUrl = getflags.getflag(match.teamHomeName);
  }
  res.status(200).json({
    match: { ...match._doc, teamHomeFlagUrl: teamHomeFlagUrl, teamAwayFlagUrl: teamAwayFlagUrl },
    livematch: livematch
  });
});

router.get("/getmatchlive/:id", async (req, res) => {
  const match = await LiveMatches.findOne({ matchId: req.params.id });
  res.status(200).json({
    match,
  });
});

router.get("/getmatch/:id", async (req, res) => {
  const match = await LiveMatches.findOne({ matchId: req.params.id });
  res.status(200).json({
    match,
  });
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


router.get("/players", async (req, res) => {
  const players = await Player.find();
  const pla = [];
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
  const ple = pla.sort(compare);

  res.status(200).json({
    message: "got all results successfully",
    data: ple,
    length: ple.length,
  });
});

router.get("/homeMatches", async (req, res) => {
  const stime = new Date().getSeconds();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = date.toISOString();
  date.setDate(date.getDate() + 10);
  const endDate = date.toISOString();
  const matches = await Matches.find({
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  });
  const promises = matches.map((fruit) =>
    LiveMatches.findOne({ matchId: fruit.matchId })
  );
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  const allmatches = await Promise.all(promises);
  const matchdetails = allmatches.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const usermatchespromises = user.matchIds.map((id) =>
    LiveMatches.findOne({ matchId: id })
  );
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  const usermatchesdetails = await LiveMatches.find({
    matchId: { $in: [...user.matchIds] },
  });
  const allusermatchesdetails = usermatchesdetails.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const userpromises = user.matchIds.map((id) =>
    Matches.findOne({ matchId: id })
  );
  const usermatches = await Matches.find({
    matchId: { $in: [...user.matchIds] },
  });
  const allusermatches = usermatches.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const teampromises = user.matchIds.map((id) =>
    Team.find({
      $and: [{ matchId: id }, { userId: req.body.uidfromtoken }],
    })
  );

  const contestpromises = user.matchIds.map((id) =>
    Contest.find({
      $and: [{ matchId: id }, { userIds: req.body.uidfromtoken }],
    })
  );
  const teamse = await Promise.all(teampromises);
  const contestse = await Promise.all(contestpromises);
  let allcontests = [];
  let allteams = [];
  contestse.forEach((c) => {
    c.forEach((k) => {
      allcontests.push(k);
    });
  });
  teamse.forEach((c) => {
    c.forEach((k) => {
      allteams.push(k);
    });
  });
  const upcomingMatches = {
    results: [],
  };
  const completedMatches = {
    results: [],
  };
  const liveMatches = {
    results: [],
  };
  const userMatches = [];
  const userMatchesDetails = {
    results: [],
  };
  for (let i = 0; i < user.matchIds.length; i++) {
    const match = allusermatches.find((m) => m.matchId == user.matchIds[i]);
    const match_det = allusermatchesdetails.find(
      (m) => m.matchId == user.matchIds[i]
    );
    if (match_det) {
      let teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamHomeName
      );
      let teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamAwayName
      );
      if (!teamAwayFlagUrl) {
        teamAwayFlagUrl = getflags.getflag(match.teamAwayName);
      }
      if (!teamHomeFlagUrl) {
        teamHomeFlagUrl = getflags.getflag(match.teamHomeName);
      }
      const mat = {
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
        teamHomeFlagUrl,
        teamAwayFlagUrl,
      };
      mat.status = match_det.status;
      mat.inPlay = match_det.inPlay;
      liveStatus = "Line-ups are out!";
      mat.livestatus = liveStatus;
      let contests = [];
      const teams = [];
      if (match_det.result == "In Progress") {
        if (match_det.status) {
          mat.livestatus = match_det.status;
          mat.lineups = "Lineups Out";
        }
        mat.result = "No";
        let teams = allteams.filter(
          (a) => a.matchId == match_det.matchId && a.userId == req.body.uidfromtoken
        );
        let contests = allcontests.filter(
          (a) =>
            a.matchId == match_det.matchId &&
            a.userIds.includes(req.body.uidfromtoken)
        );

        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          if (isToday(new Date(mat.date), new Date())) {
            liveMatches.results.push(mat);
          }
        }
      } else if (req.body.uidfromtoken && match_det.result == "Complete") {
        let teams = allteams.filter(
          (a) => a.matchId == match_det.matchId && a.userId == req.body.uidfromtoken
        );
        let contests = allcontests.filter(
          (a) =>
            a.matchId == match_det.matchId &&
            a.userIds.includes(req.body.uidfromtoken)
        );
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
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = matches[i];
    const mat = {
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
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    const matt = matchdetails.find((m) => m.matchId == matches[i].matchId);
    if (matt) {
      if (matt.result == "In Progress" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        if (!(matt.inPlay == "Yes") && matt?.teamHomePlayers?.length > 0) {
          upcomingMatches.results.push(mat);
          mat.lineups = "Lineups Out";
        } else {
          mat.result = "No";
          mat.lineups = "Lineups Out";
          if (req.body.uidfromtoken) {
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
  let time = etime - stime;
  res.status(200).json({
    upcoming: upcomingMatches,
    past: userMatchesDetails,
    live: liveMatches,
    new: matches,
    usermatch: userMatchesDetails,
    time: time,
  });
});

router.get("/home", async (req, res) => {
  const stime = new Date().getSeconds();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = new Date();
  date.setDate(date.getDate() + 10);
  const endDate = date.toISOString();
  const matches = await Matches.find({
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  });
  const upcomingMatches = {
    results: [],
  };
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = matches[i];
    const mat = {
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
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    upcomingMatches.results.push(mat);
  }
  const etime = new Date().getSeconds();
  let time = etime - stime;
  res.status(200).json({
    upcoming: upcomingMatches,
    time: time,
  });
});

router.get("/football", async (req, res) => {
  const stime = new Date().getSeconds();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = new Date();
  date.setDate(date.getDate() + 10);
  const endDate = date.toISOString();
  //const matches = await FMatch.find({
  // $and: [ {
  //   matchType:"football"},
  //   {
  //   date: {
  //     $gte: new Date(startDate),
  //     $lt: new Date(endDate),
  //   }}]
  // });
  const matches = await FMatch.find();
  const upcomingMatches = {
    results: [],
  };
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = matches[i];
    const mat = {
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
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    upcomingMatches.results.push(mat);
  }
  const etime = new Date().getSeconds();
  let time = etime - stime;
  res.status(200).json({
    upcoming: upcomingMatches,
    time: time,
  });
});

router.get("/football/:userid", async (req, res) => {
  const stime = new Date().getSeconds();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = date.toISOString();
  date.setDate(date.getDate() + 10);
  const endDate = date.toISOString();
  const matches = await FMatch.find({
    $and: [{
      matchType: "football"
    },
    {
      date: {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      }
    }]
  });
  const promises = matches.map((fruit) =>
    FLiveMatches.findOne({ matchId: fruit.matchId })
  );
  const user = await User.findOne({ _id: req.body.uidfromtoken });
  const allmatches = await Promise.all(promises);
  const matchdetails = allmatches.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const usermatchespromises = user.matchIds.map((id) =>
    FLiveMatches.findOne({ matchId: id })
  );
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  const usermatchesdetails = await FLiveMatches.find({
    matchId: { $in: [...user.matchIds] },
  });
  const allusermatchesdetails = usermatchesdetails.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const userpromises = user.matchIds.map((id) =>
    FMatch.findOne({ matchId: id })
  );
  const usermatches = await FMatch.find({
    matchId: { $in: [...user.matchIds] },
  });
  const allusermatches = usermatches.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  const teampromises = user.matchIds.map((id) =>
    Team.find({
      $and: [{ matchId: id }, { userId: req.body.uidfromtoken }],
    })
  );

  const contestpromises = user.matchIds.map((id) =>
    Contest.find({
      $and: [{ matchId: id }, { userIds: req.body.uidfromtoken }],
    })
  );
  const teamse = await Promise.all(teampromises);
  const contestse = await Promise.all(contestpromises);
  let allcontests = [];
  let allteams = [];
  contestse.forEach((c) => {
    c.forEach((k) => {
      allcontests.push(k);
    });
  });
  teamse.forEach((c) => {
    c.forEach((k) => {
      allteams.push(k);
    });
  });
  const upcomingMatches = {
    results: [],
  };
  const completedMatches = {
    results: [],
  };
  const liveMatches = {
    results: [],
  };
  const userMatches = [];
  const userMatchesDetails = {
    results: [],
  };
  for (let i = 0; i < user.matchIds.length; i++) {
    const match = allusermatches.find((m) => m.matchId == user.matchIds[i]);
    const match_det = allusermatchesdetails.find(
      (m) => m.matchId == user.matchIds[i]
    );
    if (match_det) {
      let teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamHomeName
      );
      let teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
        match.teamAwayName
      );
      if (!teamAwayFlagUrl) {
        teamAwayFlagUrl = getflags.getflag(match.teamAwayName);
      }
      if (!teamHomeFlagUrl) {
        teamHomeFlagUrl = getflags.getflag(match.teamHomeName);
      }
      const mat = {
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
        teamHomeFlagUrl,
        teamAwayFlagUrl,
      };
      mat.status = match_det.status;
      mat.inPlay = match_det.inPlay;
      liveStatus = "Line-ups are out!";
      mat.livestatus = liveStatus;
      let contests = [];
      const teams = [];
      if (match_det.result == "In Progress") {
        if (match_det.status) {
          mat.livestatus = match_det.status;
          mat.lineups = "Lineups Out";
        }
        mat.result = "No";
        let teams = allteams.filter(
          (a) => a.matchId == match_det.matchId && a.userId == req.body.uidfromtoken
        );
        let contests = allcontests.filter(
          (a) =>
            a.matchId == match_det.matchId &&
            a.userIds.includes(req.body.uidfromtoken)
        );

        if (contests.length > 0 || teams.length > 0) {
          mat.contests = contests;
          mat.teams = teams;
          if (isToday(new Date(mat.date), new Date())) {
            liveMatches.results.push(mat);
          }
        }
      } else if (req.body.uidfromtoken && match_det.result == "Complete") {
        let teams = allteams.filter(
          (a) => a.matchId == match_det.matchId && a.userId == req.body.uidfromtoken
        );
        let contests = allcontests.filter(
          (a) =>
            a.matchId == match_det.matchId &&
            a.userIds.includes(req.body.uidfromtoken)
        );
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
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = matches[i];
    const mat = {
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
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    const matt = matchdetails.find((m) => m.matchId == matches[i].matchId);
    if (matt) {
      if (matt.result == "In Progress" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        if (!(matt.inPlay == "Yes") && matt?.teamHomePlayers?.length > 0) {
          upcomingMatches.results.push(mat);
          mat.lineups = "Lineups Out";
        } else {
          mat.result = "No";
          mat.lineups = "Lineups Out";
          if (req.body.uidfromtoken) {
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
  let time = etime - stime;
  res.status(200).json({
    upcoming: upcomingMatches,
    past: userMatchesDetails,
    live: liveMatches,
    new: matches,
    usermatch: userMatchesDetails,
    time: time,
  });
});

router.get("/livematches", async (req, res) => {
  let date = new Date();
  const matchess = [];
  const endDate = new Date(date.getTime() + 10 * 60 * 60 * 1000);
  date = new Date(date.getTime() - 10 * 60 * 60 * 1000);
  const matches = await Matches.find({
    date: {
      $gte: new Date(date),
      $lt: new Date(endDate),
    },
  });
  for (let i = 0; i < matches.length; i++) {
    const matchid = matches[i].matchId;
    const match = await LiveMatches.findOne({ matchId: matchid });
    if (match && !(match?.result == "Complete")) {
      matchess.push(matches[i]);
    }
  }
  res.status(200).json({
    message: "got all results successfully",
    matches: matchess,
  });
});

router.get("/todaymatches", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const matches = await Match.find({
    date: { $gte: new Date(start), $lt: new Date(end) },
  });
  res.status(200).json({
    message: "teams got successfully",
    matches,
  });
});

router.get("/allmatches", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const matches = await Match.find();
  res.status(200).json({
    message: "teams got successfully",
    matches,
  });
});

router.get("/allFbMatches", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const matches = await FMatch.find();
  res.status(200).json({
    message: "teams got successfully",
    matches,
  });
});

router.get("/alllivematches", async (req, res) => {
  var start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  var end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const matches = await LiveMatches.find();
  let livematches = [];
  for (let i = 0; i < matches.length; i++) {
    if (matches[i] && matches[i]?.result == "In Progress") {
      livematches.push(matches[i]);
    }
  }
  res.status(200).json({
    message: "teams got successfully",
    livematches,
  });
});

router.get("/matchList", async (req, res) => {
  const stime = new Date().getSeconds();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const startDate = date.toISOString();
  date.setDate(date.getDate() + 10);
  const endDate = date.toISOString();
  const matches = await Matches.find({
    date: {
      $gte: new Date(startDate),
      $lt: new Date(endDate),
    },
  });
  const promises = matches.map((fruit) =>
    LiveMatches.findOne({ matchId: fruit.matchId })
  );
  const allmatches = await Promise.all(promises);
  const matchdetails = allmatches.filter((match, index) => {
    if (match?._id) {
      return match;
    }
  });
  //const usermatchesdetails = await Promise.all(usermatchespromises);
  const upcomingMatches = {
    results: [],
  };
  for (let i = 0; i < matches.length; i++) {
    teamAwayFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamAwayName
    );
    teamHomeFlagUrl = flagURLs.findFlagUrlByCountryName(
      matches[i].teamHomeName
    );
    if (!teamAwayFlagUrl) {
      teamAwayFlagUrl = getflags.getflag(matches[i].teamAwayName);
    }
    if (!teamHomeFlagUrl) {
      teamHomeFlagUrl = getflags.getflag(matches[i].teamHomeName);
    }
    const match = matches[i];
    const mat = {
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
      teamHomeFlagUrl,
      teamAwayFlagUrl,
    };

    liveStatus = "Line-ups are not out yet!";
    mat.livestatus = liveStatus;
    const matt = matchdetails.find((m) => m.matchId == matches[i].matchId);
    if (matt) {
      if (matt.result == "In Progress" || !matt.result) {
        if (matt.status) {
          mat.livestatus = matt.status;
        }
        if (!(matt.inPlay == "Yes") && matt?.teamHomePlayers?.length > 0) {
          upcomingMatches.results.push(mat);
          mat.lineups = "Lineups Out";
        } else {
          mat.result = "No";
          mat.lineups = "Lineups Out";
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
  let time = etime - stime;
  res.status(200).json({
    upcoming: upcomingMatches,
    time: time
  });
});

module.exports = router;
