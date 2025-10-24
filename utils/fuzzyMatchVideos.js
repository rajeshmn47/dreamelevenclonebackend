const fs = require('fs');
const { OpenAI } = require("openai");
require("dotenv").config();
const path = require('path');
const cricketSynonyms = require('./cricket_synonyms.json');
const exclusionMap = require('./exclusion_map.json');
const jerseysMap = require('./jersey_map.json');
const Clip = require('../models/clips');
const stringSimilarity = require('string-similarity');
const Player = require('../models/players');


const battingKeywords = [
    "cover drive", "extra cover", "swiped", "swipe", "on drive", "straight drive", "off drive", "lofted drive",
    "square drive", "drive", "pull", "hook", "sweep", "reverse sweep", "lap sweep", "launches",
    "paddle sweep", "scoop", "upper cut", "cut", "glance", "flick", "punch", "dab",
    "slice", "inside out", "over the top", "over long on", "over long off", "over midwicket", "swiped",
    "over extra cover", "down the ground", "backward point", "lofted shot", "heave", "nudge", "pushed",
    "top edge", "healthy edge", "edge", "top-edge", "healthy-edge", "drills it", "drills it past", "inside edge", "outside edge", "thick edge", "thin edge", "thick inside edge", "thin inside edge",
    "dances down", "over long-off", "whipped", "whips", "drives", "driven", "driving", "smashed", "smashed it", "crunched",
];

const dismissalKeywords = [
    "bowled", "clean bowled", "stumps shattered", "castled", "bails off",
    "caught", "taken", "good catch", "edge and taken", "nick", "outside edge",
    "inside edge", "lbw", "leg before", "run out", "stumped", "caught and bowled"
];

const otherKeywords = [
    "edge", "miscued", "top edge",
    "misfield", "dropped", "chance", "whipped", "smashed", "crunched",
    "fired", "slogged", "powered", "bludgeoned", "steered", "worked",
    "reverse hit", "innovation", "unorthodox"
];

const allKeywords = [...battingKeywords, ...dismissalKeywords, ...otherKeywords];

// Final filtering function
function filterCommentary(data) {
    return data.filter(item => {
        const commentaryText = item.commentary?.toLowerCase() || '';
        const keywordMatch = allKeywords.some(keyword => commentaryText.includes(keyword));
        return keywordMatch;
    });
}

const getRelevantKeywords = (event) => {
    if (event.includes("WICKET")) return dismissalKeywords;
    if (event.includes("SIX") || event.includes("FOUR")) return [...battingKeywords];
    //return otherKeywords;
};

function getkeyWords(commentary) {
    battingKeywords.filter((key) => commentary?.includes(key))
    dismissalKeywords.filter((key) => commentary?.includes(key))
    otherKeywords.filter((key) => commentary?.includes(key))
    return [...battingKeywords, ...dismissalKeywords, ...otherKeywords].filter((key) => commentary?.includes(key))
}

function filterByInputCommentaryKeywords(clips, eventType, data, inputCommentary) {
    const inputLower = inputCommentary.toLowerCase();

    // Find which keywords exist in the input commentary
    const releventkeywords = getRelevantKeywords(eventType);
    const matchedKeywordsInInput = releventkeywords?.filter(kw => inputLower.includes(kw.toLowerCase()));

    if (matchedKeywordsInInput?.length === 0) return [];

    // Filter commentary list using the matched keywords
    return data
        .map(item => {
            const commentaryLower = item.commentary?.toLowerCase() || '';
            //const eventMatch = allowedEvents.some(ev => item.event?.includes(ev));
            const matchedKeywords = matchedKeywordsInInput?.filter(kw =>
                commentaryLower.includes(kw.toLowerCase())
            );

            if (matchedKeywords?.length > 0) {
                return { ...item, matchedKeywords };
            }

            return null;
        })
        .filter(Boolean);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});

function matchesWithSynonyms(fieldValue, filterValue, field) {
    if (!fieldValue || !filterValue) return false;
    const fieldVal = fieldValue.toLowerCase();
    const filterVal = filterValue.toLowerCase();

    // Exclusion logic
    const fieldExclusions = exclusionMap[field] || {};
    const exclusions = fieldExclusions[filterValue] || [];
    if (Array.isArray(exclusions)) {
        for (const excl of exclusions) {
            if (fieldVal.includes(excl.toLowerCase())) {
                return false; // Exclusion found, do not match
            }
        }
    }

    if (fieldVal === filterVal) return true;
    if (fieldVal.includes(filterVal)) return true;

    // Synonym logic
    const fieldSynonyms = cricketSynonyms[field] || {};
    const synonyms = fieldSynonyms[filterValue] || [];
    if (!Array.isArray(synonyms)) return false;

    return synonyms.some(syn => fieldVal.includes(syn.toLowerCase()));
}

function scoreClip(commentary, clip, batsman, bowler, team, bowl_team, series, battingHand, bowlingHand, bowlerType, shotType, direction, lengthType, ballType, connection, sixType, comesDown, isKeeperCatch, lofted, powerplay, slowball) {
    let score = 0;
    const matched_input_keywords = getkeyWords(commentary)
    const matched_keywords = getkeyWords(clip?.commentary);
    let a = matched_input_keywords?.join('')
    let b = matched_keywords?.join('');
    const similarity = stringSimilarity.compareTwoStrings(commentary, clip?.commentary);
    let bar = similarity * 3
    //console.log(bowl_team, 'bar')

    {/*if (clip.shot_type && commentary.toLowerCase().includes(clip.shot_type.toLowerCase())) score += 3;
    if (batsman && clip.batsman && clip.batsman.toLowerCase() === batsman.toLowerCase()) score += 1;
    if (bowler && clip.bowler && clip.bowler.toLowerCase() === bowler.toLowerCase()) score += 1;
    if (series && clip.series && clip.series.toLowerCase() === series.toLowerCase()) score += 1;
    if (team && clip.team && clip.team.toLowerCase() === team.toLowerCase()) score += 1;
    //console.log(connection, 'connection')
    // New: Score for shotType, direction, ballType
    //console.log(shotType, direction, ballType, 'shotType direction ballType')
    if (matchesWithSynonyms(clip.commentary, direction, "direction") && commentary?.toLowerCase().includes("Eshan Malinga to Harshit Rana, B0$, smashed wide of long-on. A slower-ball off-cutter outside off, Harshit Rana stays back and belts that so hard, into the gap"?.toLowerCase())) {
        //console.log(matchesWithSynonyms(clip.commentary, direction, "direction"), clip?.commentary, 'scored')
    }
    if (shotType && (clip.shotType?.toLowerCase() === shotType.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, shotType, "shotType"))) score += 5;
    if (direction && (clip.direction?.toLowerCase() === direction.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, direction, "direction"))) score += 5;
    if (ballType && (clip.ballType?.toLowerCase() === ballType?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, ballType, "ballType"))) score += 3;
    if (shotType && (clip?.ballType?.toLowerCase() === ballType?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, "lofted", "lofted"))) score += 1;
    if (connection && (clip?.commentary?.toLowerCase() === ballType?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, "connection", connection))) score += 2;
    if (sixType && (clip?.commentary?.toLowerCase() === ballType?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, "sixType", sixType))) score += 1;
    if (comesDown && (clip?.commentary?.toLowerCase() === comesDown?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, "comesDown", comesDown))) score += 1;
    if (isKeeperCatch && (clip?.commentary?.toLowerCase() === comesDown?.toLowerCase() ||
        matchesWithSynonyms(clip.commentary, "keeperCatch", isKeeperCatch))) score += 5;
    if (battingHand && (!battingHand == "unknown") && (clip?.battingHand?.toLowerCase() === battingHand.toLowerCase())) score += 5;
    if (bowlingHand && (!bowlingHand == "unknown") && (clip?.bowlingHand?.toLowerCase() === bowlingHand?.toLowerCase())) score += 5;
    if (bowlerType && (!bowlerType == "unknown") && (clip?.bowlerType?.toLowerCase() === bowlerType?.toLowerCase())) score += 5;
    score = score + bar
    return score;*/}
    //console.log(clip?.labels,'labels')
    const scoreBreakdown = {};

    if (batsman && clip.batsman && clip.batsman.toLowerCase() === batsman.toLowerCase()) {
        score += 1;
        scoreBreakdown.batsmanMatch = 1;
    }

    if (bowler && clip.bowler && clip.bowler.toLowerCase() === bowler.toLowerCase()) {
        score += 1;
        scoreBreakdown.bowlerMatch = 1;
    }

    if (series && clip.series && clip.series.toLowerCase() === series.toLowerCase()) {
        score += 1;
        scoreBreakdown.seriesMatch = 1;
    }

    if (team && clip.team && clip.batting_team.toLowerCase() === team.toLowerCase()) {
        score += 1;
        scoreBreakdown.teamMatch = 1;
    }

    if (team && clip.team && clip.bowling_team.toLowerCase() === bowl_team.toLowerCase()) {
        score += 1;
        scoreBreakdown.bowlTeamMatch = 1;
    }

    // Match synonyms
    //console.log(clip?.labels, 'labels')
    if (shotType && (clip?.labels?.shotType?.toLowerCase() == shotType.toLowerCase())) {
        score += 5;
        scoreBreakdown.shotTypeSynonymMatch = 5;
    }

    if (direction && (clip?.labels?.direction?.toLowerCase() == direction.toLowerCase())) {
        score += 5;
        scoreBreakdown.directionSynonymMatch = 5;
    }

    if (lengthType && (clip?.labels?.lengthType?.toLowerCase() == lengthType.toLowerCase())) {
        score += 5;
        scoreBreakdown.lengthType = 5;
    }

    if (ballType && (clip?.labels?.ballType?.toLowerCase() == ballType?.toLowerCase())) {
        score += 3;
        scoreBreakdown.ballTypeMatch = 3;
    }

    if (connection && (clip?.labels?.connection?.toLowerCase() == connection?.toLowerCase())) {
        score += 3;
        scoreBreakdown.connection = 3;
    }

    if (lofted && (clip?.labels?.lofted)) {
        score += 5;
        scoreBreakdown.lofted = 5;
    }

    if (!lofted && (clip?.labels?.lofted)) {
        score += -2;
        scoreBreakdown.lofted = -2;
    }

    if (battingHand && battingHand !== "unknown" && clip?.battingHand?.toLowerCase() === battingHand.toLowerCase()) {
        score += 5;
        scoreBreakdown.battingHandMatch = 5;
    }

    if (bowlingHand && bowlingHand !== "unknown" && clip?.bowlingHand?.toLowerCase() === bowlingHand?.toLowerCase()) {
        score += 5;
        scoreBreakdown.bowlingHandMatch = 5;
    }

    if (bowlerType && bowlerType !== "unknown" && clip?.bowlerType?.toLowerCase() === bowlerType?.toLowerCase()) {
        score += 5;
        scoreBreakdown.bowlerTypeMatch = 5;
    }
    if (powerplay == "powerplay") {
        score += 1;
        scoreBreakdown.powerplay = 1;
    }

    if (slowball) {
        //console.log(slowball, 'slowball')
        score += 1;
        scoreBreakdown.slowball = 1;
    }

    if (comesDown && comesDown == clip?.labels?.comesDown) {
        console.log(comesDown, 'comes down')
        score += 3;
        scoreBreakdown.comesDown = 3;
    }

    const clipBatColor = getJerseyColor(clip.batting_team);
    const clipBowlColor = getJerseyColor(clip.bowling_team);
    const userBatColor = getJerseyColor(team);
    const userBowlColor = getJerseyColor(bowl_team);

    const clipBatGroup = getColorGroup(clipBatColor);
    const clipBowlGroup = getColorGroup(clipBowlColor);
    const userBatGroup = getColorGroup(userBatColor);
    const userBowlGroup = getColorGroup(userBowlColor)

    if (clipBatColor === userBatColor && (!(clipBatColor == "not found"))) {
        score += 2;
        scoreBreakdown.battingColorExact = 1;
    } else if (clipBatGroup && clipBatGroup === userBatGroup) {
        score += 2;
        scoreBreakdown.battingColorGroup = 0.5;
    }

    // Bowling color match
    if (clipBowlColor === userBowlColor && (!(clipBowlColor == "not found"))) {
        //console.log('layer', clipBowlColor, userBowlColor, team, 'bat coolor')
        score += 2;
        scoreBreakdown.bowlingColorExact = 1;
    } else if (clipBowlGroup && clipBowlGroup === userBowlGroup) {
        score += 0.5;
        scoreBreakdown.bowlingColorGroup = 0.5;
    }

    if (clipBowlColor === userBowlColor && clipBatColor === userBatColor && (!(clipBatColor == "not found")) && (!(clipBowlColor == "not found"))) {
        score += 5;
        scoreBreakdown.bothMatched = 5;
    }

    // Add custom bar score
    score += bar;
    scoreBreakdown.bar = bar;
    scoreBreakdown.commentary = clip?.commentary

    // ✅ Final log
    //console.log("🎯 Final Score:", score);
    //console.log("📊 Score Breakdown:", scoreBreakdown);

    return { score: score, breakdown: scoreBreakdown };

}

async function filterClipsByEventOnly(clips, event, commentary) {

    //console.log(clips.length, 'clips length')
    if (commentary.toLowerCase()?.includes("stumped") && event?.includes("WICKET")) {
        //console.log(commentary, 'commentary stumped link')
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "season") || (clip.season == "2025")).filter(clip => clip.commentary.includes("stumped"));
    }
    if (commentary.toLowerCase()?.includes("caught&bowled") && event?.includes("WICKET")) {
        //console.log(commentary, clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "season")).filter(clip => clip.commentary?.toLowerCase().includes("caught&bowled")), 'commentary caught&bowled link')
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021") || (clip.season == "2025")).filter(clip => clip.commentary?.toLowerCase().includes("caught&bowled"));
    }
    if (commentary.toLowerCase()?.includes("bowled") && event?.includes("WICKET") && (!(commentary.toLowerCase()?.includes("caught&bowled")))) {
        //console.log(commentary,clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021")).filter(clip => clip.commentary.includes("bowled!")).filter(clip => (!(clip.commentary.includes("bowled out"))) || (!(clip.commentary.includes("caught&bowled!")))), 'commentary bowled link')
        //console.log(clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021")).filter(clip => clip.commentary?.toLowerCase().includes("bowled!")).filter(clip => (!(clip.commentary?.toLowerCase().includes("bowled out"))) || (!(clip.commentary?.toLowerCase().includes("caught&bowled!")))).filter((clip) => (!(clip.commentary?.toLowerCase().includes("caught&bowled!")))), "bowled")
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021") || (clip.season == "2025")).filter(clip => clip.commentary?.toLowerCase().includes("bowled!")).filter(clip => (!(clip.commentary?.toLowerCase().includes("bowled out"))) || (!(clip.commentary?.toLowerCase().includes("caught&bowled!")))).filter((clip) => (!(clip.commentary?.toLowerCase().includes("caught&bowled!"))));
    }
    if (commentary.toLowerCase()?.includes("caught") && event?.includes("WICKET")) {
        //console.log(commentary, 'commentary caught link')
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021") || (clip.season == "2025")).filter(clip => clip.commentary?.toLowerCase().includes("caught"));
    }
    if ((commentary.toLowerCase()?.includes("run out") || commentary.toLowerCase()?.includes("runout")) && event?.includes("WICKET")) {
        //console.log(commentary, 'commentary run out link')
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021") || (clip.season == "2025")).filter(clip => clip.commentary?.toLowerCase().includes("run out") || clip.commentary?.toLowerCase().includes("runout"));
    }
    if (commentary.toLowerCase()?.includes("lbw") && event?.includes("WICKET")) {
        //console.log(commentary, 'commentary lbw link')
        return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2022") || (clip.season == "2024") || (clip.season == "2021") || (clip.season == "2025")).filter(clip => clip.commentary?.toLowerCase().includes("lbw"));
    }
    return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join('')).filter(clip => (clip.season == "2021") || (clip.season == "2025"));
}

async function gptFallback(commentary, filteredClips) {
    const topClips = filteredClips.slice(0, 25);
    const fileDescriptions = topClips
        .map(({ clip, commentary }) => `Filename: ${clip}, Description: ${commentary}`)
        .join("\n");

    const messages = [
        {
            role: "system",
            content: `You are a professional cricket video analyst. You are given a piece of commentary and a list of video clip descriptions. Each clip has a filename and a brief description of the action. Your task is to carefully analyze the commentary and select the clip whose description most accurately reflects the meaning and action in the commentary, not just keywords. Focus on the shot type, placement, bowler and batsman actions, and result (like FOUR, SIX, WICKET, etc).
          Avoid guessing or repeating clips unless they are truly the best fit. You must return only the filename of the single most relevant video clip that semantically matches the given commentary. If no perfect match exists, choose the one with the highest overall similarity in meaning and action.
          Output only the filename, like: clip_8.4_at_336.0_115653_1.mp4,dont return anything else.just return filename`
        },
        {
            role: "user",
            content: `Commentary: "${commentary}"\n\nClips: \n${fileDescriptions}`,
        },
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0.2,
        });

        const result = response.choices[0].message.content.trim();
        //console.log(result, 'gpt resulte')
        const match = result.match(/[\w\-]+\.mp4/i);
        return match ? result : "unknown";
    } catch (err) {
        console.error("GPT Error:", err.message);
        return "unknown";
    }
}

async function getBestMatchingVideo(clips, event, commentary, details, bowling_team) {
    const batsman = details?.batsmanStriker?.batName;
    const bowler = details?.bowlerStriker?.bowlName;
    const team = details?.batTeamName;
    const bowl_team = bowling_team;
    const series = details?.seriesName;
    let shotType = details?.shotType;
    let direction = details?.direction;
    let ballType = details?.ballType;
    let lengthType = details?.lengthType;
    let sixType;
    let comesDown;
    let isKeeperCatch;
    let isCaught;
    let lofted;
    //console.log(details, 'details')
    let overNumber = details.overNumber;

    if (!shotType) shotType = extractFieldFromCommentary(commentary, "shotType", overNumber);
    if (!direction) direction = extractFieldFromCommentary(commentary, "direction", overNumber);
    if (!ballType) ballType = extractFieldFromCommentary(commentary, "ballType", overNumber);
    if (!lengthType) lengthType = extractFieldFromCommentary(commentary, "lengthType", overNumber);
    connection = extractFieldFromCommentary(commentary, "connection", overNumber);
    if (event?.includes("SIX")) {
        sixType = extractFieldFromCommentary(commentary, "sixType", overNumber);
    }
    if ((commentary?.toLowerCase().includes("caught") || commentary?.toLowerCase().includes("catch")) && event?.includes("WICKET")) {
        isKeeperCatch = extractFieldFromCommentary(commentary, "keeperCatch", overNumber);
    }
    if (!comesDown) comesDown = extractFieldFromCommentary(commentary, "comesDown", overNumber);
    if (!lofted) lofted = extractFieldFromCommentary(commentary, "lofted", overNumber) ? 'lofted' : false;
    let powerplay = extractFieldFromCommentary(commentary, "powerplay", overNumber);
    let slowball = extractFieldFromCommentary(commentary, "slowball", overNumber)
    //console.log(slowball, lofted, 'slowball test')
    const filteredClips = await filterClipsByEventOnly(clips, event, commentary);
    let Batsman = await Player.findOne({ name: batsman });
    let Bowler = await Player.findOne({ name: bowler });
    let battingHand = Batsman?.battingHand || "unknown";
    let bowlingHand = Bowler?.bowlingHand || "unknown";
    let bowlerType = Bowler?.bowlerType || "unknown";
    //console.log(details, 'filtered clips length')
    const scored = filteredClips.map(clip => {
        const { score, breakdown } = scoreClip(
            commentary,
            clip,
            batsman,
            bowler,
            team,
            bowl_team,
            series,
            battingHand,
            bowlingHand,
            bowlerType,
            shotType,
            direction,
            lengthType,
            ballType,
            connection,
            sixType,
            comesDown,
            isKeeperCatch,
            lofted,
            powerplay,
            slowball
        );

        return {
            clip,
            score,
            breakdown
        };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0]?.score || 0;
    const topMatches = scored.filter(c => c.score === topScore);
    if (commentary?.toLowerCase().includes("Eshan Malinga to Harshit Rana, B0$, smashed wide of long-on. A slower-ball off-cutter outside off, Harshit Rana stays back and belts that so hard, into the gap"?.toLowerCase())) {
        //console.log(scored[0], shotType, ballType, direction, connection, scored[1], 'scored')
    }
    //console.log(scored[0], topScore, commentary, 'top score')
    if (topScore < 2) {
        //console.log(scored, 'all scored')
        // GPT fallback
        let commentaryList = filteredClips;
        //const gptClip = await gptFallback(commentary, filteredbyKeywords.slice(0, 25));
        const gptClip = "no clip"
        //console.log(scored[0], 'nott found')
        return scored[0]?.clip.clip || "n";
    }
    //console.log(scored[0], 'all scored')
    return { videoLink: scored[0]?.clip.clip || "n", breakdown: scored[0]?.breakdown || { 'abcd': 'none' } };
}

function extractFieldFromCommentary(commentary, field, over) {
    if (!commentary) return null;
    const fieldSynonyms = cricketSynonyms[field] || {};
    const lowerCommentary = commentary.toLowerCase();
    if (field == "powerplay") {
        if (over <= 6) {
            return 'powerplay'
        }
    }
    if (field == "lofted") {
        const fieldSynonyms = cricketSynonyms["lofted"] || {};
        const lowerCommentary = commentary.toLowerCase();
        //console.log(fieldSynonyms, 'synonymn')
        for (const key in fieldSynonyms) {
            // Check if the main key or any of its synonyms appear in the commentary
            const fieldExclusions = exclusionMap[field] || {};
            const exclusions = fieldExclusions[key] || [];
            let exit = false;
            if (Array.isArray(exclusions)) {
                for (const excl of exclusions) {
                    //console.log(excl, 'exclusion')
                    if (commentary.includes(excl.toLowerCase())) {
                        exit = true // Exclusion found, do not match
                    }
                }
            }
            if (exit) continue;
            if (lowerCommentary.includes(key.toLowerCase())) return key;
            const synonyms = fieldSynonyms[key];
            if (Array.isArray(synonyms)) {
                for (const syn of synonyms) {
                    if (lowerCommentary.includes(syn.toLowerCase())) return key;
                }
            }
        }
        return null;
    }
    for (const key in fieldSynonyms) {
        // Check if the main key or any of its synonyms appear in the commentary
        const fieldExclusions = exclusionMap[field] || {};
        const exclusions = fieldExclusions[key] || [];
        let exit = false;
        if (Array.isArray(exclusions)) {
            for (const excl of exclusions) {
                //console.log(excl, 'exclusion')
                if (commentary.includes(excl.toLowerCase())) {
                    exit = true // Exclusion found, do not match
                }
            }
        }
        if (exit) continue;
        if (lowerCommentary.includes(key.toLowerCase())) return key;
        const synonyms = fieldSynonyms[key];
        if (Array.isArray(synonyms)) {
            for (const syn of synonyms) {
                if (lowerCommentary.includes(syn.toLowerCase())) return key;
            }
        }
    }
    return null;
}

function getJerseyColor(team) {
    let color = ''
    let matched_team = jerseysMap?.find((map_team_2) => map_team_2?.short?.toLowerCase() == team?.toLowerCase() ||
        map_team_2?.team?.toLowerCase() == team?.toLowerCase())
    //console.log(matched_team, 'matched team')
    return matched_team?.jerseyColor || 'not found'
}

function getColorGroup(jerseyColor) {
    for (const group in colorGroups) {
        if (colorGroups[group].some(color => jerseyColor.includes(color))) {
            return group;
        }
    }
    return null;
}

const colorGroups = {
    Blue: ["Blue", "Dark Blue", "Light Blue", "Blue and Red", "Blue and Gold", "Teal"],
    Red: ["Red", "Red and Gold", "Red and Black", "Red and Blue", "Red and White", "Maroon", "Pink", "Pink and Blue"],
    Green: ["Green", "Dark Green", "Light Green", "Lime Green"],
    Yellow: ["Yellow", "Red and Yellow"],
    Orange: ["Orange", "Orange and Black"],
    Black: ["Black", "Grey", "Purple and Gold", "Purple"],
};

module.exports.fuzzyMatchVideo = getBestMatchingVideo;