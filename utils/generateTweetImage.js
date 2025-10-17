const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require("path");
const localFilePath = path.join("images/blanke.png"); // adjust path if needed
const fetch = require("node-fetch");

function formatMatchStart(dateString) {
    const date = new Date(dateString);

    // Format time in IST (Asia/Kolkata)
    const timeOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    };
    const time = new Intl.DateTimeFormat("en-US", timeOptions).format(date);

    // Get today's and match date in IST
    const todayIST = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const dateIST = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    // Normalize dates to midnight for easy comparison
    const todayMidnight = new Date(todayIST.setHours(0, 0, 0, 0));
    const matchMidnight = new Date(dateIST.setHours(0, 0, 0, 0));

    const diffDays = Math.round(
        (matchMidnight - todayMidnight) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
        return `Match starts at ${time} today`;
    } else if (diffDays === 1) {
        return `Match starts at ${time} tomorrow`;
    } else {
        const dayOptions = {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Kolkata",
        };
        const day = new Intl.DateTimeFormat("en-US", dayOptions).format(date);
        return `Match starts at ${time} on ${day}`;
    }
}

function drawEllipsisText(ctx, text, x, y, maxWidth, font = "bold 40px Arial") {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // If text already fits, just draw it
    if (ctx.measureText(text).width <= maxWidth) {
        ctx.fillText(text, x, y);
        return;
    }

    // Otherwise trim and add ellipsis
    let ellipsis = "…";
    let trimmedText = text;
    while (ctx.measureText(trimmedText + ellipsis).width > maxWidth && trimmedText.length > 0) {
        trimmedText = trimmedText.slice(0, -1); // remove last character
    }
    ctx.fillText(trimmedText + ellipsis, x, y);
}

async function downloadImage(player) {
    try {
        console.log(player, 'playerimage')
        let url = `https://firebasestorage.googleapis.com/v0/b/dreamelevenclone.appspot.com/o/images%2F${player.id}.png?alt=media&token=4644f151-3dfd-4883-9398-4191bed34854`
        filename = `/${player.id}.png`
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const buffer = await response.buffer();
        const filePath = path.join(__dirname, "..", "images", filename);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${filename}, already exists.`);
            return filePath;
        }
        if (buffer) {
            fs.writeFileSync(filePath, buffer);
            console.log(`✅ Saved ${filename}`);
            return filePath;
        }
        else {
            fs.writeFileSync(filePath, fs.readFileSync('images/blank.png'));
            return filePath
        }
    }
    catch (error) {
        filename = `/${player.id}.png`
        const filePath = path.join(__dirname, "..", "images", filename);
        fs.writeFileSync(filePath, fs.readFileSync('images/blank.png'));
        return filePath
    }
}

async function createVsImage(teamA, teamB, captainAImage, captainBImage, outputFile, matchDate) {
    await downloadImage(captainAImage)
    await downloadImage(captainBImage)
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    // Capitalize helper
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    teamA = capitalize(teamA);
    teamB = capitalize(teamB);

    // Background
    ctx.fillStyle = '#1e1e1e'; // dark background
    ctx.fillRect(0, 0, width, height);

    // Load captain images
    const imgA = await loadImage(`./images/${captainAImage.id}.png`);
    const imgB = await loadImage(`./images/${captainBImage.id}.png`);

    // Draw images
    ctx.drawImage(imgA, 50, 100, 200, 200);  // left
    ctx.drawImage(imgB, width - 250, 100, 200, 200); // right

    // VS Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VS', width / 2, height / 2 + 20);

    // Team Names
    ctx.font = 'bold 40px Arial';
    ctx.fillText(teamA, 150, 50);
    ctx.fillText(teamB, width - 150, 50);

    // Match Date (bottom center)
    ctx.font = '30px Arial';
    ctx.fillStyle = '#f0c419'; // yellowish highlight
    ctx.textAlign = 'center';
    ctx.fillText(formatMatchStart(matchDate), width / 2, height - 30);

    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputFile, buffer);
    console.log('Image created:', outputFile);
}

async function createResultImage(
    teamHomeCode,
    teamAwayCode,
    teamHomeName,
    teamAwayName,
    homeScore,
    awayScore,
    winnerTeamName,
    outputPath,
    matchDate
) {
    try {
        console.log(teamHomeCode,
            teamAwayCode,
            teamHomeName,
            teamAwayName,
            homeScore,
            awayScore,
            winnerTeamName,
            outputPath,
            matchDate)
        const width = 1200;
        const height = 675;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // 🎨 Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0f2027");
        gradient.addColorStop(0.5, "#203a43");
        gradient.addColorStop(1, "#2c5364");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 🏏 Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 48px Sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏏 MATCH RESULT", width / 2, 80);

        // 🏆 Scores layout
        ctx.font = "bold 60px Sans-serif";
        ctx.textAlign = "center";

        // Home Team
        ctx.fillStyle = winnerTeamName === teamHomeName ? "#00ff88" : "#ffffff";
        ctx.fillText(`${teamHomeName}`, width / 4, 250);
        ctx.font = "bold 50px Sans-serif";
        ctx.fillText(`${homeScore}`, width / 4, 320);

        // Away Team
        ctx.font = "bold 60px Sans-serif";
        ctx.fillStyle = winnerTeamName === teamAwayName ? "#00ff88" : "#ffffff";
        ctx.fillText(`${teamAwayName}`, (3 * width) / 4, 250);
        ctx.font = "bold 50px Sans-serif";
        ctx.fillText(`${awayScore}`, (3 * width) / 4, 320);

        // VS in the middle
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 64px Sans-serif";
        ctx.fillText("VS", width / 2, 280);

        // Winner text
        ctx.font = "bold 46px Sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Winner: ${winnerTeamName} 🎉`, width / 2, 450);

        // Date
        ctx.font = "28px Sans-serif";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(`${matchDate}`, width / 2, 520);

        // Save file
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Result image saved: ${outputPath}`);
    }
    catch (error) {
        console.log(error, 'error')
    }
}

async function createIBImage(
    battingTeamName,
    battingTeamScore,
    outputPath,
    matchDate,
    teamLogoPath = null // optional: path to team logo image
) {
    try {
        const width = 1200;
        const height = 675;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#232526");
        gradient.addColorStop(1, "#414345");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Helper for shadow text
        function drawTextWithShadow(text, x, y, color, font, align = "center") {
            ctx.font = font;
            ctx.textAlign = align;
            ctx.shadowColor = "black";
            ctx.shadowBlur = 8;
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            ctx.shadowBlur = 0;
        }

        // INNINGS BREAK Title
        drawTextWithShadow("INNINGS BREAK", width / 2, 110, "#ffcc00", "bold 70px Sans-serif");

        // Team logo (optional)
        if (teamLogoPath) {
            try {
                const logo = await loadImage(teamLogoPath);
                ctx.drawImage(logo, width / 2 - 80, 180, 160, 160);
            } catch (e) {
                // If logo not found, skip
            }
        }

        // Batting Team Name
        drawTextWithShadow(battingTeamName, width / 2, 400, "#ffffff", "bold 64px Sans-serif");

        // Batting Team Score
        drawTextWithShadow(battingTeamScore, width / 2, 480, "#00eaff", "bold 80px Sans-serif");

        // Footer message
        drawTextWithShadow("2nd Innings Coming Up!", width / 2, 570, "#ffffff", "bold 44px Sans-serif");

        // Date
        drawTextWithShadow(matchDate, width / 2, 630, "#cccccc", "28px Sans-serif");

        // Save file
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Professional Innings Break image saved: ${outputPath}`);
    } catch (error) {
        console.log(error, "error");
    }
}

async function createMOMImage(playerImage, playerName, teamName, stats, outputPath, playerInfo) {
    await downloadImage(playerImage[0])
    const width = 800;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f05a28');
    gradient.addColorStop(1, '#f9d423');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Player image
    const playerImg = await loadImage(`./images/${playerImage[0].id}.png`);
    const imgHeight = 400;
    const imgWidth = (playerImg.width / playerImg.height) * imgHeight;
    //ctx.drawImage(playerImg, width - imgWidth - 50, height - imgHeight - 25, imgWidth, imgHeight);
    const scale = 0.7;
    const newImgWidth = imgWidth * scale;
    const newImgHeight = imgHeight * scale;

    ctx.drawImage(playerImg, width - newImgWidth - 50, height - newImgHeight - 135, newImgWidth, newImgHeight);

    // Text: “Man of the Match”
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Man of the Match', 50, 80);

    // Player Name
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(playerName, 50, 150);

    // Team + Stats
    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${teamName}`, 50, 190);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    //ctx.fillText(`${stats}`, 50, 250);
    let perf = playerInfo;
    let perfText = "";
    console.log(perf, 'perf')
    // check batting stats
    if (perf?.runs !== undefined && perf?.balls !== undefined && perf.runs > 0) {
        perfText += `${perf.runs} runs off ${perf.balls} balls`;
    }

    // check bowling stats
    if (perf?.wickets !== undefined && perf?.runsConceded !== undefined && perf.wickets > 0) {
        if (perfText) perfText += " & ";
        perfText += `${perf.wickets} wickets for ${perf.runsConceded} runs`;
    }

    // fallback if no stats
    if (!perfText) perfText = "Outstanding all-round performance";
    //drawEllipsisText(ctx, `perfText`, width / 2, 480, 500, "28px Arial");
    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${perfText}`, 50, 230);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log('MOM image generated:', outputPath);
}

// Example usage


module.exports = { createResultImage, createIBImage, createVsImage, createMOMImage };


// Example usage

