const request = require("request");

async function makeRequest(options) {
    //console.log(options, 'options')
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            }
            if (body) {
                //console.log(body, 'body')
                const s = JSON.parse(body);
                resolve({ ...s, headers: response.headers });
            }
            else {
                resolve(null);
            }
        });
    });
}

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

module.exports = { makeRequest, generateMatchHashtags };