module.exports.detectHighlights = function (commentaryList) {
    if (!Array.isArray(commentaryList)) return [];
    //console.log(commentaryList, 'commentaryList')
    const last18 = commentaryList;
    const oversMap = new Map();

    for (const ball of last18) {
        const overNumRaw = ball.overNumber ?? ball.ballNbr ?? 0;
        const over = Math.floor(overNumRaw); // Group by integer part of overNumber
        const key = `${ball.inningsId ?? 1}-${over}`;

        if (!oversMap.has(key)) oversMap.set(key, []);
        oversMap.get(key).push(ball);
    }

    //console.log(oversMap, 'oversMap')

    const highlights = [];

    for (const [key, overBalls] of oversMap.entries()) {
        let consWicket = 0, consSix = 0, consFour = 0;
        let maxConsWicket = 0, maxConsSix = 0, maxConsFour = 0;
        let wicketCount = 0, sixCount = 0, fourCount = 0;
        let batter = ""
        let clips = []
        let bowler = ""
        //console.log(overBalls, 'overBalls')
        for (const ball of overBalls) {
            const event = ball.event?.toLowerCase() || "";

            const isWicket = event.includes("wicket");
            const isSix = event === "six";
            const isFour = event === "four";

            if (isWicket && ball?.videoLink) {
                wicketCount++;
                consWicket++;
                consSix = 0;
                consFour = 0;
                batter = ball?.batsmanStriker?.batName || 'rajesh'
                bowler = ball?.bowlerStriker?.bowlName || 'rajesh'
                clips.push({ ...ball, clip: ball.videoLink || "" })
            } else if (isSix && ball?.videoLink) {
                sixCount++;
                consSix++;
                consWicket = 0;
                consFour = 0;
                batter = ball?.batsmanStriker?.batName || 'rajesh'
                bowler = ball?.bowlerStriker?.bowlName || 'rajesh'
                clips.push({ ...ball, clip: ball.videoLink || "" })
            } else if (isFour && ball?.videoLink) {
                fourCount++;
                consFour++;
                consSix = 0;
                consWicket = 0;
                batter = ball?.batsmanStriker?.batName || 'rajesh'
                bowler = ball?.bowlerStriker?.bowlName || 'rajesh'
                clips.push({ ...ball, clip: ball.videoLink || "" })
            } else {
                consWicket = 0;
                consSix = 0;
                consFour = 0;
            }

            maxConsWicket = Math.max(maxConsWicket, consWicket);
            maxConsSix = Math.max(maxConsSix, consSix);
            maxConsFour = Math.max(maxConsFour, consFour);
        }

        const [inningsId, over] = key.split("-");
        const meta = {
            inningsId: parseInt(inningsId),
            overNumber: parseInt(over),
            events: overBalls.map(b => b.event),
            batter: batter,
            bowler: bowler,
            clips: clips
        };

        if (wicketCount >= 10) highlights.push({ type: "2+ Wickets", count: wicketCount, ...meta });
        if (sixCount >= 10) highlights.push({ type: "3+ Sixes", count: sixCount, ...meta });
        if (fourCount >= 10) highlights.push({ type: "4+ Fours", count: fourCount, ...meta });

        if (maxConsWicket >= 2) {
            console.log(maxConsWicket, 'wicket length')
            highlights.push({ type: "Consecutive Wickets", count: maxConsWicket, ...meta });
        }
        if (maxConsSix >= 3) {
            console.log(maxConsSix, 'last18 length')
            highlights.push({ type: "Consecutive Sixes", count: maxConsSix, ...meta });
        }
        if (maxConsFour >= 3) highlights.push({ type: "Consecutive Fours", count: maxConsFour, ...meta });
    }

    return highlights;
}