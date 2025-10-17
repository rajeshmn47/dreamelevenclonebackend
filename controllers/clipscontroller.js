const Clip = require("../models/clips");
const express = require("express");
const Matches = require("../models/match");
const Contest = require("../models/contest");
const Team = require("../models/team");
const User = require("../models/user");
const Match = require("../models/match");
const ContestType = require("../models/contestType");
const request = require("request");
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const NewPayment = require("../models/newPayment");
const Withdraw = require("../models/withdraw");
const Transaction = require("../models/transaction");

const router = express.Router();

// ✅ CREATE a single clip
router.post("/", async (req, res) => {
    try {
        const clip = new Clip(req.body);
        const savedClip = await clip.save();
        res.status(201).json(savedClip);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ READ all clips
router.get("/allclips", async (req, res) => {
    try {
        const clips = await Clip.find().sort({ createdAt: 1 });
        res.json(clips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ READ a single clip by ID
router.get("/getclip/:id", async (req, res) => {
    try {
        const clip = await Clip.findById(req.params.id);
        if (!clip) return res.status(404).json({ error: "Clip not found" });
        res.json(clip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ UPDATE a clip
router.put("/update-clip/:id", async (req, res) => {
    try {
        const updatedClip = await Clip.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updatedClip) return res.status(404).json({ error: "Clip not found" });
        res.json(updatedClip);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ✅ DELETE a clip
router.delete("/delete-clip/:id", async (req, res) => {
    try {
        const clip = await Clip.findByIdAndDelete(req.params.id);
        if (!clip) return res.status(404).json({ error: "Clip not found" });
        if (clip.clip) {
            const filePath = path.join(__dirname, "..", "allclips", path.basename(clip.clip));
            fs.unlink(filePath, (err) => {
                if (err) console.warn("Failed to delete file:", filePath, err.message);
            });
        }
        res.json({ message: "Clip deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ BULK INSERT (from earlier)
router.post("/bulk-insert", async (req, res) => {
    try {
        const clips = req.body; // Or define statically if needed
        const result = await Clip.insertMany(clips);
        res.status(201).json({ success: true, count: result.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/delete-multiple", async (req, res) => {
    try {
        const { clips } = req.body;

        if (!Array.isArray(clips) || clips.length === 0) {
            return res.status(400).json({ success: false, message: "No clips provided" });
        }

        // Delete files from filesystem
        for (const clipName of clips) {
            const filePath = path.join(__dirname, "../allclips", clipName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from MongoDB
        await Clip.deleteMany({ clip: { $in: clips } });

        res.json({ success: true });
    } catch (err) {
        console.error("Delete clips error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post('/cut', (req, res) => {
    const { filename, startTime, duration } = req.body;

    const inputPath = path.join(__dirname, '../public/mockvideos', filename);
    const outputFilename = `cut-${Date.now()}-${filename}`;
    const outputPath = path.join(__dirname, '../public/mockvideos', outputFilename);

    ffmpeg(inputPath)
        .setStartTime(startTime) // e.g., "00:00:05"
        .setDuration(duration)   // e.g., 10 (seconds)
        .output(outputPath)
        .on('end', () => {
            res.json({ success: true, file: outputFilename });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ success: false, message: 'Cut failed' });
        })
        .run();
});

router.post('/merge', async (req, res) => {
    console.log(req.body, 'body')
    const { clips } = req.body; // array of filenames, e.g., ["cut-1.mp4", "cut-2.mp4"]
    files = clips
    console.log(clips, files, 'files')
    if (!Array.isArray(files) || files.length < 2) {
        return res.status(400).json({ success: false, message: 'At least two files required to merge' });
    }

    const tempFileList = path.join(__dirname, '../temp_file_list.txt');
    const videoDir = path.join(__dirname, '../allclips');

    // Create FFmpeg input list file
    const listContent = files.map(file => `file '${path.join(videoDir, file)}'`).join('\n');
    fs.writeFileSync(tempFileList, listContent);

    const outputFilename = `merged-${Date.now()}.mp4`;
    const outputPath = path.join(videoDir, outputFilename);

    ffmpeg()
        .input(tempFileList)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions('-c copy')
        .output(outputPath)
        .on('end', () => {
            fs.unlinkSync(tempFileList); // clean up
            res.json({ success: true, file: outputFilename });
        })
        .on('error', (err) => {
            console.error(err);
            fs.unlinkSync(tempFileList);
            res.status(500).json({ success: false, message: 'Merge failed', error: err.message });
        })
        .run();
});

// POST /clips/report
router.post('/report', async (req, res) => {
    const { clipId } = req.body; // send clip _id from frontend

    if (!clipId) {
        return res.status(400).json({ success: false, message: 'clipId is required' });
    }

    try {
        // Set reported to true (simple flag)
        const clip = await Clip.findOneAndUpdate(
            { clip: clipId },
            { reported: true },
            { new: true } // return the updated document
        );

        if (!clip) {
            return res.status(404).json({ success: false, message: 'Clip not found' });
        }

        res.json({ success: true, reported: clip.reported });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error reporting clip' });
    }
});


module.exports = router;