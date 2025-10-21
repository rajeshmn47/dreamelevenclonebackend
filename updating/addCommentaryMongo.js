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
const { isInPlay } = require("../utils/isInPlay");
const { sendTweetWithImage } = require("../utils/sendTweet");
const { createMOMImage, createIBImage, createResultImage } = require("../utils/generateTweetImage");

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

function generateMatchHashtags(team1, team2, seriesName) {
    const baseTag = `#${team1.replace(/\s/g, '')}Vs${team2.replace(/\s/g, '')}`;
    const tags = [baseTag, '#Cricket', '#asiacup2025'];

    const leagueMap = {
        'indian premier league': ['#IPL', '#IPL2025'],
        'pakistan super league': ['#PSL', '#PSL2025'],
        'big bash league': ['#BBL', '#BBL2025'],
        'caribbean premier league': ['#CPL', '#CPL2025'],
        'the hundred': ['#TheHundred', '#TheHundred2025']
        // Add more as needed
    };

    const normalizedSeries = seriesName?.toLowerCase();

    for (const [league, hashtags] of Object.entries(leagueMap)) {
        if (normalizedSeries.includes(league)) {
            tags.push(...hashtags);
            break;
        }
    }

    return tags.join(' ');
}

module.exports.addLivecommentaryMongo = async function addcommentry(format) {
    try {
        //await Series.updateMany({}, { $set: { importance: "medium" } })
        const importance = format;
        const startDate = new Date("2025-01-01T00:00:00Z");
        const endDate = new Date("2025-12-31T23:59:59Z");
        let date = new Date();
        let allMatches = [];
        //const endDate = new Date(date.getTime());
        date = new Date(date.getTime() - 120 * 60 * 60 * 1000);
        let matches;
        if (format == "low" || format == "high" || format == "very_high") {
            matches = await Matches.find({
                date: {
                    $gte: date,
                    $lt: new Date(),
                }
            }).populate("series");
            //console.log(format, 'importance')
            matches = matches.filter(m => {
                if (!m.seriesId) return false;
                return m.importance == format || m.series.importance == format
            });
        }
        else {
            //console.log(format, 'mediumz')
            matches = await Matches.find({
                format: format,
                importance: "medium",
                //matchId: "116669",
                date: {
                    $gte: date,
                    $lt: new Date(),
                }
            });
        }

        const m = matches;
        console.log(m.length, "cricket allmatches");
        for (let i = 0; i < matches.length; i++) {
            const match = await MatchLiveDetails.findOne({ matchId: matches[i].matchId });
            //console.log(match, 'the match')
            const livecommentary = await MatchLiveCommentary.findOne({ matchId: match?.matchId })
            if (!match || (!match?.isInPlay)) continue
            console.log(matches[i].matchId, match?.isInPlay, 'matchid')
            if (m[i].matchId.length > 3) {
                //console.log(m[i]?.matchId, "id matchid");
                //const keys = await getkeys.getkeys();
                const options = {
                    method: "GET",
                    url: `https://www.cricbuzz.com/api/cricket-match/${m[i].matchId}/full-commentary/1`,
                };
                const options2 = {
                    method: "GET",
                    url: `https://www.cricbuzz.com/api/cricket-match/${m[i].matchId}/full-commentary/2`,
                };
                try {
                    let response = await axios.request(options);
                    //console.log( response?.data?.commentary?.[0]?.commentaryList, "commentary");
                    let innings = 2;
                    if (response?.data?.commentary?.[0]?.commentaryList?.length > 0) {
                        response = await axios.request(options);
                        const result = response?.data?.matchDetails?.matchHeader?.state == "Complete" ? "Complete" : "In Progress";
                        let isinplay = isInPlay(result, matches[i].date);
                        await MatchLiveCommentary.updateOne({ matchId: m[i]?.matchId }, {
                            $set: {
                                teamHomeId: m?.[i]?.teamHomeId,
                                teamAwayId: m?.[i].teamAwayId,
                                teamAwayCommentary: response?.data?.commentary?.[0]?.commentaryList,
                                isInPlay: isinplay,
                                result: response?.data?.matchDetails?.matchHeader?.state ? "Complete" : "In Progress"
                            }
                        }, { upsert: true }
                        )
                        //console.log(match, 'away')
                        let runs_fi = match?.runFI;
                        if (match?.teamAwayPlayers && match?.result == "Complete" && match?.isInPlay && (importance == 'high' || importance == 'very_high')) {
                            let players = [...match?.teamHomePlayers, ...match?.teamAwayPlayers]
                            const manofthematch = response?.data?.matchDetails?.matchHeader?.playersOfTheMatch
                            let a = players.find((p) => p?.playerId == manofthematch[0].id)
                            //console.log(a, 'player')
                            let tweetText = `🏆 Man of the Match: ${manofthematch[0]?.name} (${manofthematch[0]?.teamName})\n\n` +
                                `${a.runs} runs off ${a.balls} balls\n\n` +
                                `Full match details 👉 https://www.cricbuzz.com/live-cricket-scores/${matches[i]?.matchId}\n\n` +
                                `${generateMatchHashtags(matches[i].teamHomeCode, matches[i].teamAwayCode, matches[i].matchTitle)}`

                            await createMOMImage(
                                manofthematch,
                                manofthematch[0]?.name,
                                manofthematch[0]?.teamName,
                                `${a.runs} runs off ${a.balls} balls`,
                                `./images/mom/mom_${matches[i]?.matchId}.png`,
                                a
                            );
                            await sendTweetWithImage(tweetText, `./images/mom/mom_${matches[i].matchId}.png`);
                        }
                        //console.log(response?.data?.matchDetails?.matchHeader?.state?.toLowerCase(), 'innings break test')
                        const match_result = response?.data?.matchDetails?.matchHeader?.state?.toLowerCase()
                        console.log(match_result, 'match resultr')
                        console.log('abcdefgh')
                        if ((match_result == 'innings break' && (importance == 'high' || importance == 'very_high'))) {
                            let score = `${match?.runFI}/${match?.wicketsFI} (${match?.oversFI} overs)`
                            //console.log(match, 'match')
                            await createIBImage(
                                match.titleFI,
                                score,
                                `./images/ib/ib_${match.matchId}.png`,
                                matches?.[i]?.date,
                                null
                            );
                            const tweetText = `Innings Break!
                            ${matches?.[i].teamHomeName} post ${score} in their 1st innings.
                            Stay tuned as ${matches?.[i].teamAwayName} gears up for the chase! 🔥
                            ${generateMatchHashtags(matches?.[i].teamHomeName, matches?.[i].teamAwayName, matches?.[i].matchTitle)}`
                            await sendTweetWithImage(tweetText, `./images/ib/ib_${matches[i].matchId}.png`);
                        }
                        console.log('ijklmnop')
                        if (match_result == "complete" && (importance == 'high' || importance == 'very_high')) {
                            //continue
                            let title_fi = match?.titleFI;
                            let title_si = match?.titleSI;
                            console.log(title_fi, 'i')
                            let abandoned = false;
                            let winner = match?.runFI > match?.runSI ? title_fi : title_si;
                            let tweetText = `Lineups Out: ${matches[i].teamHomeName} vs ${match.teamAwayName}\nThe lineups for ${matches[i].teamHomeName} and ${matches[i].teamAwayName} are now available. Check out the details!
                                https://www.cricbuzz.com/live-cricket-scores/${match?.matchId} \n${generateMatchHashtags(matches[i].teamHomeCode, matches[i].teamAwayCode, matches[i].matchTitle)}`
                            await createResultImage(matches[i].teamHomeCode, matches[i].teamAwayCode, title_fi,
                                title_si, match?.runFI, match?.runSI, winner, `./images/completed/${match.matchId}_vs_image.png`, matches?.[i]?.date, abandoned); // Assuming first player is captain
                            await sendTweetWithImage(tweetText, `./images/completed/${match.matchId}_vs_image.png`);
                        }
                        console.log('abcdef')
                        if (match_result == "abandon" && (importance == 'high' || importance == 'very_high')) {
                            //console.log(title_fi, 'i')
                            let title_fi = match?.titleFI;
                            let title_si = match?.titleSI;
                            let abandoned = true;
                            let winner = match?.runFI > match?.runSI ? title_fi : title_si;
                            let tweetText = `Lineups Out: ${matches[i].teamHomeName} vs ${match.teamAwayName}\nThe lineups for ${matches[i].teamHomeName} and ${matches[i].teamAwayName} are now available. Check out the details!
                                https://www.cricbuzz.com/live-cricket-scores/${match?.matchId} \n${generateMatchHashtags(matches[i].teamHomeCode, matches[i].teamAwayCode, matches[i].matchTitle)}`
                            await createResultImage(matches[i].teamHomeCode, matches[i].teamAwayCode, title_fi,
                                title_si, match?.runFI, match?.runSI, winner, `./images/completed/${match.matchId}_vs_image.png`, matches?.[i]?.date, abandoned); // Assuming first player is captain
                            await sendTweetWithImage(tweetText, `./images/completed/${match.matchId}_vs_image.png`);
                        }
                        console.log('abcdef')
                        innings = 1;
                        response = await axios.request(options2);
                        console.log(match_result, response?.data?.commentary?.[0]?.commentaryList?.length, 'resulty')
                        if (response?.data?.commentary?.[0]?.commentaryList?.length > 0) {
                            const match_result = response?.data?.matchDetails?.matchHeader?.state?.toLowerCase()
                            await MatchLiveCommentary.updateOne({ matchId: m[i]?.matchId }, {
                                $set: {
                                    teamHomeCommentary: response?.data?.commentary?.[0]?.commentaryList
                                }
                            }, { upsert: true }
                            )
                            console.log(match_result, 'resulty')
                            let isin_play = isInPlay(match_result, matches[i].date);
                            console.log(isin_play, match_result, 'isinplay value')
                            const matchUpdate = await MatchLiveDetails.updateOne(
                                { matchId: match?.matchId },
                                {
                                    $set: {
                                        isInPlay: isin_play,
                                    },
                                }
                            );
                        }
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
                                //console.log(miniscore?.batsmanStriker?.batId, 'miniscore')
                                const res = await commentaryRef.set(
                                    {
                                        commentary: [...a],
                                        livedata: matchdata,
                                        miniscore,
                                    },
                                    { merge: true }
                                );
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
