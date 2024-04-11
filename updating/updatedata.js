const express = require("express");
const router = express.Router();
const fMatches = require("../controllers/fMatchDB-controller");
const addlivescoresnew = require("./addlivescoresdetails");
const addLiveCommentary = require("./firebase");

router.get("/addlivedetails", async (req, res) => {
  try {
    //await addlivenew.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addlivescore", async (req, res) => {
  try {
    await addlivescoresnew.addLivematchtodb();
    res.status(200).json({
      message: "user already exists",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/updateteams", async (req, res) => {
  try {
    //await teamstandings.addTeamstandingstodb();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});
router.get("/addtransaction", async (req, res) => {
  try {
    //await transaction.startTransaction();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addmatchtodb", async (req, res) => {
  try {
    //await matches.addMatchtoDb();
    //await addingteam.addPlayers();
    res.status(200).json({
      message: "added matches successfully",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});
router.get("/addFmatchtodb", async (req, res) => {
  try {
    await fMatches.addMatchtoDb();
    //await addingteam.addPlayers();
    res.status(200).json({
      message: "added matches successfully",
      success: false,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});


router.get("/addmatchids", async (req, res) => {
  try {
    //await addIds.addMatchIds();
    res.status(200).json({
      message: "matches added successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addlivecommentary", async (req, res) => {
  try {
    await addLiveCommentary.addLivecommentary();
    res.status(200).json({
      message: "added successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addteams", async (req, res) => {
  try {
    //await addingteam.addPlayers();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

router.get("/addteamse", async (req, res) => {
  try {
    //await addingteame.addteamPlayers();
    res.status(200).json({
      message: "saved successfully",
      success: true,
    });
  } catch (err) {
    console.log(`Error : ${err}`);
    res.status(200).json({
      message: "could not save",
      success: false,
    });
  }
});

module.exports = router;
