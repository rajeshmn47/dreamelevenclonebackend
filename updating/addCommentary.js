const axios = require("axios");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const MatchLiveDetails = require("../models/matchlive");
const Matches = require("../models/match");
const Team = require("../models/team");
const getkeys = require("../utils/crickeys");
const getcommentary = require("../utils/getcommentary");
const db = require("../utils/firebaseinitialize");

const transporter = nodemailer.createTransport(
  smtpTransport({
    host: process.env.smtp_host,
    port: process.env.smtp_port,
    secure: true,
    auth: {
      user: process.env.smtp_user,
      pass: process.env.smtp_password,
    },
  })
);

const mailOptions = {
  from: process.env.smtp_user,
  to: "rajeshmn47@gmail.com",
  subject: "Sending Email using Node.js[nodemailer]",
  text: `riyan parag is batting`,
};

//initializeApp({
//credential: cert(serviceAccount),
//});

//const db = getFirestore();
// Add a new document with a generated id.
module.exports.addLivecommentary = async function addcommentry() {
  try {
    let date = new Date();
    let allMatches = [];
    const endDate = new Date(date.getTime());
    date = new Date(date.getTime() - 100 * 60 * 60 * 1000);
    const matches = await Matches.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      },
    });

    //  const citiesRef = db.db.collection('commentary');
    //  const snapshot = await citiesRef.get();
    //  if (snapshot.empty) {
    //    console.log('No matching documents.');
    //    return;
    // }
    // snapshot.forEach(async doc => {
    //  console.log(doc.id, '=>', doc.data());
    //  const commentaryRef = db.db.collection("commentary").doc(doc.id);
    //  const res = await commentaryRef.set(
    //    {
    //      commentary: [...doc.data().capital],
    //      livedata: !doc.data().matchdata ? 'not found' : doc.data().matchdata,
    //      miniscore: !doc.data().miniscore ? 'not found' : doc.data().miniscore
    //    },
    //    { merge: true }
    // );
    //});
    for (let i = 0; i < matches.length; i++) {
      const matchid = matches[i].matchId;
      //const teams = await Team.find({ matchId: matchid });
      const teams = ['1']
      if (teams.length > 0) {
        const match = await MatchLiveDetails.findOne({ matchId: matchid });
        if (match && !(match.result == "Complete") && (match?.isInPlay)) {
          allMatches.push(matches[i]);
        }
      }
    }
    const m = allMatches;
    for (let i = 0; i < allMatches.length; i++) {
      if (m[i].matchId.length > 3) {
        const keys = await getkeys.getkeys();
        const options = {
          method: "GET",
          url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${m[i].matchId}/comm`,
          headers: {
            //"X-RapidAPI-Key": 'b9ac58be1fmsh1dc31cbe511d761p103bb8jsn4389ec6b3355',
            //"X-RapidAPI-Key":"f39c66c5a9mshe4e04348c634a6ap1f75edjsn3d3394bd6fc0",
            //"X-RapidAPI-Key":"4725ff9c4dmshd2f385a556069f6p10a2efjsn34ee02dac63e"
            //"X-RapidAPI-Key": "bcb2a1e864msh516fde1e4c87b71p1fd9cfjsna047a0277aa0",
            //"X-RapidAPI-Key": "3a990f059cmsh70cd4953ddaf696p1ac371jsnff076beee96d",
            //"X-RapidAPI-Key":'375b34052emsh67282e5524cc40bp1d3caajsnc0805e37d86e',
            "X-RapidAPI-Key": keys,
            "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
          },
        };
        try {
          const response = await axios.request(options);
          if (response?.data?.commentaryList?.length > 0) {
            const a = response?.data?.commentaryList.reverse();
            const matchdata = response.data.matchHeader;
            const { miniscore } = response.data;
            const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
            const doc = await commentaryRef.get();
            if (!doc.exists) {
              const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
              const res = await commentaryRef.set(
                {
                  commentary: [...a],
                  livedata: matchdata,
                  miniscore,
                },
                { merge: true }
              );
            } else {
              if (a.length > 0) {
                const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
                let xyz = doc.data().commentary;
                let commentary = getcommentary.getcommentary(xyz, a);
                console.log(miniscore?.batsmanStriker?.batId, 'miniscore')
                if (miniscore?.batsmanStriker?.batId == 12305) {
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.log(error);
                    } else {
                      console.log(`Email sent: ${info.response}`);
                    }
                  });
                }
                const res = await commentaryRef.set(
                  {
                    commentary: [...commentary],
                    livedata: matchdata,
                    miniscore,
                  },
                  { merge: true }
                );
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};
