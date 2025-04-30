const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const oversJsonPath = path.join(__dirname, 'overs_with_clips.json');

function filterClipsByEventOnly(event,clips) {
    return clips.filter(clip => clip.event.split('over-break,').join('') === event.split('over-break,').join(''));
}

function findBestMatchingOver(data,eventType, inputCommentary) {
    if (!data.length) return null;
    const filtered = filterClipsByEventOnly(eventType,data)
    const commentaries = filtered.map(item => item.commentary || '');

    const { bestMatch, bestMatchIndex, ratings } = stringSimilarity.findBestMatch(inputCommentary, commentaries);

    if (bestMatch.rating > 0.3) {
        const matchedRecord = filtered[bestMatchIndex];
        console.log(`✅ Matched with over ${matchedRecord.over} (Score: ${bestMatch.rating.toFixed(2)})`);
        return matchedRecord?.clip;
    }

    console.log('⚠️ No good match found');
    return null;
}

module.exports = { findBestMatchingOver };
