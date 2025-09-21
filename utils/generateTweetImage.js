const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require("path");
const localFilePath = path.join("images/blanke.png"); // adjust path if needed
const fetch = require("node-fetch");

function formatMatchStart(dateString) {
    const date = new Date(dateString);

    // Format time in hh:mm AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert to 12-hour format
    const time = `${hours}:${minutes} ${ampm}`;

    // Check if it's today
    const today = new Date();
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isToday) {
        return `Match starts at ${time} today`;
    } else {
        const day = date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
        return `Match starts at ${time} Today`;
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

