const MatchLiveDetails = require("../models/matchlive");
const Matches = require("../models/match");
const Team = require("../models/team");
const getkeys = require("../utils/crickeys");
const db = require("../utils/firebaseinitialize");
const DetailScores = require("../models/detailscores");
const { fuzzyMatchVideo } = require("../utils/fuzzyMatchVideo")

module.exports.updateBalls = async function () {
    try {
        let date = new Date();
        let matchess = [];
        const endDate = new Date(date.getTime());
        date = new Date(date.getTime() - 26 * 60 * 60 * 1000);
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
            const match = await MatchLiveDetails.findOne({ matchId: matchid });
            if (match && !(match.result == "Complete") && match?.isInPlay) {
                matchess.push(matches[i]);
            }
        }
        const m = matchess;
        for (let i = 0; i < matchess.length; i++) {
            if (m[i].matchId.length > 3) {
                try {
                    const commentaryRef = db.db.collection("commentary").doc(m[i].matchId);
                    const doc = await commentaryRef.get();
                    if (doc.exists && doc.data().commentary && doc.data().commentary.length > 0) {
                        let xyz = doc.data().commentary;
                        let fBalls = [];
                        let sBalls = [];
                        // console.log(matchess[i].matchId, 'data')
                        let firstTeam = matchess[i].isHomeFirst ? matchess[i].teamHomeName : matchess[i].teamAwayName;
                        let secondTeam = !matchess[i].isHomeFirst ? matchess[i].teamHomeName : matchess[i].teamAwayName;;
                        for (let a = 0; a < xyz.length; a++) {
                            let over = xyz[a]?.overSeparator;
                            if (over && over.inningsId == 1) {
                                let overArray = over?.o_summary.split(' ');
                                for (let b = 0; b < 6; b++) {
                                    fBalls.push({ ballNbr: parseInt((xyz[a].ballNbr - (5 - b))), runs: isNaN(overArray[b]) ? 0 : parseInt(overArray[b]), event: overArray[b] })
                                }
                            }
                            else if (over && over.inningsId == 2) {
                                let overArray = over?.o_summary.split(' ');
                                for (let b = 0; b < 6; b++) {
                                    sBalls.push({ ballNbr: parseInt((xyz[a].ballNbr - (5 - b))), runs: isNaN(overArray[b]) ? 0 : parseInt(overArray[b]), event: overArray[b] })
                                }
                            }
                        }
                        let updatedCommentary = []
                        for (let a = 0; a < xyz.length; a++) {
                            console.log(xyz[a].event)
                            const event = xyz[a].event;
                            if (!xyz[a]?.videoLink) {
                                if (event === 'FOUR' || event === 'SIX' || event === 'WICKET') {
                                    const batsmanName = xyz[a]?.commText || 'batsman';
                                    const teamName = matchess[i]?.battingTeam?.replace(/ /g, "_") || 'team';
                                    const shotType = event === 'FOUR' ? 'four' : event === "SIX" ? 'six' : 'wicket';

                                    const keyword = `${teamName}_${batsmanName}_${shotType}`;

                                    const videoLink = await fuzzyMatchVideo(keyword) // your fuzzy logic to get video

                                    xyz[a].videoLink = videoLink || ''; // fallback if not found
                                    updatedCommentary.push({
                                        ...xyz[a],
                                        videoLink: videoLink || '',
                                    });
                                }
                                else {
                                    updatedCommentary.push(xyz[a])
                                }
                            }
                            else {
                                updatedCommentary.push(xyz[a])
                            }
                        }
                        //console.log(updatedCommentary, 'updated commentary')
                        const res = await commentaryRef.set(
                            {
                                commentary: updatedCommentary,
                                livedata: doc.data().livedata,
                                miniscore: doc.data().miniscore
                            },
                            { merge: true }
                        );
                        {/*for (let a = 0; a <= 20; a++) {
                            let overArray = '1 6 0 1 2 4'.split(' ');
                            for (let b = 0; b < 6; b++) {
                                console.log((a - (5 - b)), 'fball number')
                                fBalls.push({ ballNbr: parseInt(a * 6 - (5 - b)), runs: isNaN(overArray[b]) ? 0 : parseInt(overArray[b]), event: overArray[b] })
                            }
                            let overArray2 = '0 4 w 1 2 2'.split(' ');
                            for (let b = 0; b < 6; b++) {
                                sBalls.push({ ballNbr: parseInt(a * 6 - (5 - b)), runs: isNaN(overArray2[b]) ? 0 : parseInt(overArray2[b]), event: overArray2[b] })
                            }

                        }*/}
                        let detail = await DetailScores.findOne({ matchId: m[i]?.matchId });
                        if (!detail) {
                            await DetailScores.create({
                                matchId: m[i].matchId, firstInningsBalls: fBalls,
                                secondInningsBalls: sBalls
                            })
                        }
                        else {
                            const firBalls = fBalls.filter((f) => !(detail.firstInningsBalls.find((b) => b.ballNbr == f.ballNbr)));
                            const firInnBalls = [...detail.firstInningsBalls.filter((b, index) => detail.firstInningsBalls.find((l) => detail.firstInningsBalls.indexOf(l) == index))]
                            const secBalls = sBalls.filter((x) => !(detail.secondInningsBalls.find((b) => b.ballNbr == x.ballNbr)));
                            const secInnBalls = [...detail.secondInningsBalls.filter((b, index) => detail.secondInningsBalls.find((l) => detail.secondInningsBalls.indexOf(l) == index))]
                            //  console.log(sBalls, fBalls, 'secdata')
                            await DetailScores.updateOne({
                                matchId: m[i].matchId
                            }, {
                                firstTeam: firstTeam,
                                secondTeam: secondTeam,
                                firstInningsBalls: [...firBalls, ...firInnBalls],
                                secondInningsBalls: [...secBalls, ...secInnBalls,]
                            })
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
