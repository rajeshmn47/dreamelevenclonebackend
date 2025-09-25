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

module.exports.createVsImage = async function (teamA, teamB, captainAImage, captainBImage, outputFile, matchDate) {
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

// Example usage

