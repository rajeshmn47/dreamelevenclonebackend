const fs = require('fs');
const { OpenAI } = require("openai");
require("dotenv").config();
const path = require('path');
const clips = require("../overs_with_clips.json");

const battingKeywords = [
    "cover drive", "extra cover", "swiped", "swipe", "on drive", "straight drive", "off drive", "lofted drive",
    "square drive", "drive", "pull", "hook", "sweep", "reverse sweep", "lap sweep", "launches",
    "paddle sweep", "scoop", "upper cut", "cut", "glance", "flick", "punch", "dab",
    "slice", "inside out", "over the top", "over long on", "over long off", "over midwicket", "swiped",
    "over extra cover", "down the ground", "backward point", "lofted shot", "heave", "nudge", "pushed",
    "top edge", "healthy edge", "edge","top-edge", "healthy-edge", "drills it", "drills it past", "inside edge", "outside edge", "thick edge", "thin edge", "thick inside edge", "thin inside edge",
    "dances down", "over long-off"
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

function filterByInputCommentaryKeywords(eventType, data, inputCommentary) {
    const inputLower = inputCommentary.toLowerCase();

    // Find which keywords exist in the input commentary
    const releventkeywords = getRelevantKeywords(eventType);
    const matchedKeywordsInInput = releventkeywords.filter(kw => inputLower.includes(kw.toLowerCase()));

    if (matchedKeywordsInInput.length === 0) return [];

    // Filter commentary list using the matched keywords
    return data
        .map(item => {
            const commentaryLower = item.commentary?.toLowerCase() || '';
            //const eventMatch = allowedEvents.some(ev => item.event?.includes(ev));
            const matchedKeywords = matchedKeywordsInInput.filter(kw =>
                commentaryLower.includes(kw.toLowerCase())
            );

            if (matchedKeywords.length > 0) {
                return { ...item, matchedKeywords };
            }

            return null;
        })
        .filter(Boolean);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});

function scoreClip(commentary, clip, batsman, bowler, team, series) {
    let score = 0;

    if (clip.event && commentary.toLowerCase().includes(clip.event.toLowerCase())) score += 5;
    if (clip.shot_type && commentary.toLowerCase().includes(clip.shot_type.toLowerCase())) score += 3;
    if (batsman && clip.batsman && clip.batsman.toLowerCase() === batsman.toLowerCase()) score += 2;
    if (bowler && clip.bowler && clip.bowler.toLowerCase() === bowler.toLowerCase()) score += 2;
    if (series && clip.series && clip.series.toLowerCase() === series.toLowerCase()) score += 1;
    if (team && clip.team && clip.team.toLowerCase() === team.toLowerCase()) score += 1;

    return score;
}

function filterClipsByEventOnly(event) {
    return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join(''));
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
          Output only the filename, like: clip_8.4_at_336.0_115653_1.mp4,dont return anything else.`
        },
        {
            role: "user",
            content: `Commentary: "${commentary}"\n\nClips:\n${fileDescriptions}`,
        },
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0.2,
        });

        const result = response.choices[0].message.content.trim();
        console.log(result, 'gpt resulte')
        const match = result.match(/[\w\-]+\.mp4/i);
        return match ? result : "unknown";
    } catch (err) {
        console.error("GPT Error:", err.message);
        return "unknown";
    }
}

async function getBestMatchingVideo(event, commentary, details) {
    console.log(event, 'event')
    const batsman = details?.batsmanStriker?.batName;
    const bowler = details?.bowlerStriker?.bowlName;
    const team = details?.batTeamName;
    const series = details?.seriesName;

    const filteredClips = filterClipsByEventOnly(event);
    const scored = filteredClips.map(clip => ({
        clip,
        score: scoreClip(commentary, clip, batsman, bowler, team, series)
    }));

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0]?.score || 0;
    const topMatches = scored.filter(c => c.score === topScore);
    if (event == 'FOUR') {
        //console.log(filteredClips.slice(0, 25), 'top matches')
    }
    if (topScore < 8 || topMatches.length > 1) {
        // GPT fallback
        let commentaryList = filteredClips
        const filteredbyKeywords = filterByInputCommentaryKeywords(event, commentaryList, commentary);
        const gptClip = await gptFallback(commentary, filteredbyKeywords.slice(0, 25));
        if (event == 'SIX') {
            console.log(filteredbyKeywords, commentary, 'top matches')
            console.log(gptClip, 'gpt clip')
        }
        return gptClip !== "unknown" ? gptClip : scored[0]?.clip.clip || "n";
    }

    return scored[0]?.clip.clip || "n";
}

module.exports.fuzzyMatchVideo = getBestMatchingVideo;
