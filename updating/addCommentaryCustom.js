const axios = require("axios");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const MatchLiveDetails = require("../models/matchlive");
const Matches = require("../models/match");
const getkeys = require("../utils/crickeys");
const db = require("../utils/firebaseinitialize");
const { getcommentary } = require("../utils/getcommentary");
const { sendMyPlayerNotifications } = require("../utils/sendMyPlayerNotifications");
const { detectHighlights } = require("../utils/detectHighlights");
const Series = require("../models/series");
const MatchLiveCommentary = require("../models/matchCommentary");
const { homegraph } = require("googleapis/build/src/apis/homegraph");

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
    from: process.env.smtp_email,
    to: "rajeshmn47@gmail.com",
    subject: "Real time notification of your favourite player",
    text: `riyan parag is batting`,
};

//initializeApp({
//credential: cert(serviceAccount),
//});

//const db = getFirestore();
// Add a new document with a generated id.
module.exports.addLivecommentaryCustom = async function addcommentry(format) {
    try {
        // await Series.updateMany({}, { $set: { importance: "medium" } })
        let date = new Date();
        let allMatches = [];
        const endDate = new Date(date.getTime());
        date = new Date(date.getTime() - 120 * 60 * 60 * 1000);
        let matches;
        if (format == "low" || format == "high" || format == "very_high") {
            matches = await Matches.find({
                date: {
                    $gte: new Date(date),
                    $lt: new Date(endDate),
                }
            }).populate("series");
            console.log(format, 'importance')
            matches = matches.filter(m => {
                if (!m.seriesId) return false;
                return m.importance == format || m.series.importance == format
            });
        }
        else {
            console.log(format, 'mediumz')
            matches = await Matches.find({
                format: format,
                //importance: "medium",
                //matchId: "116828",
                date: {
                    $gte: new Date(date),
                    $lt: new Date(endDate),
                },
            });
        }

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
            console.log(matchid, 'jio')
            const match = await MatchLiveDetails.findOne({ matchId: matchid });
            if (match && (!(match.result == "Complete")) && (match?.isInPlay)) {
                allMatches.push(matches[i]);
            }
        }
        const m = allMatches;
        console.log(m.length, "cricket allmatches");
        for (let i = 0; i < allMatches.length; i++) {
            if (m[i].matchId.length > 3) {
                console.log(m[i]?.matchId, "matchid");
                //const keys = await getkeys.getkeys();
                let teamHomeCommentary = [];
                let teamAwayCommentary = [];
                const options = {
                    method: "GET",
                    //url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${m[i].matchId}/comm`,
                    //url: `https://m.cricbuzz.com/api/mcenter/highlights/${m[i].matchId}/2`,
                    url: `https://www.cricbuzz.com/api/mcenter/${m[i].matchId}/full-commentary/2`,
                    headers: {
                        //"X-RapidAPI-Key": 'b9ac58be1fmsh1dc31cbe511d761p103bb8jsn4389ec6b3355',
                        //"X-RapidAPI-Key":"f39c66c5a9mshe4e04348c634a6ap1f75edjsn3d3394bd6fc0",
                        //"X-RapidAPI-Key":"4725ff9c4dmshd2f385a556069f6p10a2efjsn34ee02dac63e"
                        //"X-RapidAPI-Key": "bcb2a1e864msh516fde1e4c87b71p1fd9cfjsna047a0277aa0",
                        //"X-RapidAPI-Key": "3a990f059cmsh70cd4953ddaf696p1ac371jsnff076beee96d",
                        //"X-RapidAPI-Key":'375b34052emsh67282e5524cc40bp1d3caajsnc0805e37d86e',
                        //"X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
                        //"X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
                    },
                };
                const options2 = {
                    method: "GET",
                    //url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${m[i].matchId}/comm`,
                    //url: `https://m.cricbuzz.com/api/mcenter/highlights/${m[i].matchId}/2`,
                    url: `https://www.cricbuzz.com/api/mcenter/${m[i].matchId}/full-commentary/1`,
                    headers: {
                        //"X-RapidAPI-Key": 'b9ac58be1fmsh1dc31cbe511d761p103bb8jsn4389ec6b3355',
                        //"X-RapidAPI-Key":"f39c66c5a9mshe4e04348c634a6ap1f75edjsn3d3394bd6fc0",
                        //"X-RapidAPI-Key":"4725ff9c4dmshd2f385a556069f6p10a2efjsn34ee02dac63e"
                        //"X-RapidAPI-Key": "bcb2a1e864msh516fde1e4c87b71p1fd9cfjsna047a0277aa0",
                        //"X-RapidAPI-Key": "3a990f059cmsh70cd4953ddaf696p1ac371jsnff076beee96d",
                        //"X-RapidAPI-Key":'375b34052emsh67282e5524cc40bp1d3caajsnc0805e37d86e',
                        //"X-RapidAPI-Key": "17394dbe40mshd53666ab6bed910p118357jsn7d63181f2556",
                        //"X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
                    },
                };
                try {
                    let response = await axios.request(options);
                    //console.log(response?.data, "commentary");
                    let innings = 2;
                    if (response?.data?.commentary?.[0]?.commentaryList?.length > 0) {
                        response = await axios.request(options);
                    }
                    else {
                        innings = 1;
                        response = await axios.request(options2);
                    }
                    if (response?.data?.commentary?.[0]?.commentaryList?.length > 0) {
                        const a = response?.data?.commentary?.[0]?.commentaryList.reverse();
                        const matchdata = response.data.matchDetails?.matchHeader;
                        const { miniscore } = response.data?.matchDetails;
                        const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
                        const doc = await commentaryRef.get();
                        if (!doc.exists) {
                            await sendMyPlayerNotifications(miniscore?.batsmanStriker?.batId, miniscore?.bowlerStriker?.bowlId)
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
                            const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
                            let xyz = doc.data().commentary;
                            if (a?.length > 0) {
                                let commentary = getcommentary(xyz, a, innings);
                                //let commentary = a;
                                console.log(miniscore?.batsmanStriker?.batId, 'miniscore')
                                await sendMyPlayerNotifications(miniscore?.batsmanStriker?.batId, miniscore?.bowlerStriker?.bowlId)
                                if (miniscore?.batsmanStriker?.batId == 12305) {
                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log(`Email sent: ${info.response}`);
                                        }
                                    });
                                }
                                //console.log(commentary, 'commentary')
                                let home = matches?.[i].teamHomeName
                                let away = matches?.[i].teamAwayName
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
