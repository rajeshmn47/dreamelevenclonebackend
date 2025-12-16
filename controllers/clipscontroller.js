const Clip = require("../models/clips");
const express = require("express");
const path = require('path');
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const Matches = require("../models/match");
const Player = require("../models/players");

const router = express.Router();

// ✅ CREATE a single clip
router.post("/create", async (req, res) => {
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

router.get("/getmatchclips/:id", async (req, res) => {
    try {
        const clip = await Clip.find({ matchId: req.params.id });
        if (!clip) return res.status(404).json({ error: "Clip not found" });
        res.json(clip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /matches - return matches with associated clips
// GET /matches?seriesId=&series=&matchId=&matchType=&season=&fromDate=&toDate=&hasClips=true&page=1&limit=10&sort=dateDesc&includeClips=true&perClipLimit=5
router.get("/matches", async (req, res) => {
    try {
        const {
            seriesId,
            series,
            matchId,
            type,
            format,
            season,
            fromDate,
            toDate,
            hasClips,
            page = 1,
            limit = 100,
            sort = "dateDesc",
            includeClips = "false",
            perClipLimit = 5,
            importance,
            ballType,
            shotType,
            direction,
            lengthType,
            connection,
            slowball,
            lofted,
            comesDown,
            powerplay
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const pageSize = Math.max(1, parseInt(limit, 10));
        const skip = (pageNum - 1) * pageSize;
        const include = includeClips === "true";
        const perLimit = Math.max(1, parseInt(perClipLimit, 10));

        // Build filter
        const filter = {};
        if (seriesId) filter.seriesId = seriesId;
        if (series) filter.series = { $regex: series, $options: "i" };
        if (matchId) filter.matchId = matchId;
        if (type) filter.type = type;
        if (format) filter.format = format;
        if (season) filter.season = season;
        if (importance) filter.importance = importance;
        if (fromDate || toDate) {
            filter.date = {};
            if (fromDate) filter.date.$gte = new Date(fromDate);
            if (toDate) filter.date.$lte = new Date(toDate);
        }

        // Add labels filters
        if (ballType) filter["labels.ballType"] = { $regex: ballType, $options: "i" };
        if (shotType) filter["labels.shotType"] = { $regex: shotType, $options: "i" };
        if (direction) filter["labels.direction"] = { $regex: direction, $options: "i" };
        if (lengthType) filter["labels.lengthType"] = { $regex: lengthType, $options: "i" };
        if (connection) filter["labels.connection"] = { $regex: connection, $options: "i" };
        if (slowball) filter["labels.slowball"] = { $regex: slowball, $options: "i" };
        if (comesDown) filter["labels.comesDown"] = { $regex: comesDown, $options: "i" };
        if (powerplay) filter["labels.powerplay"] = { $regex: powerplay, $options: "i" };
        if (lofted !== undefined) filter["labels.lofted"] = lofted === "true";

        const sortSpec = sort === "dateAsc" ? { date: 1 } : { date: -1 };

        // total matches count
        const total = await Matches.countDocuments(filter);

        let matches = [];
        // If sorting by clip count we need to load all matches, count clips, sort in JS, then paginate
        if (sort === "clipsDesc" || sort === "clipsAsc") {
            const allMatches = await Matches.find(filter).lean();
            for (let i = 0; i < allMatches.length; i++) {
                const m = allMatches[i];
                const matchIdVal = m.matchId === undefined || m.matchId === null ? null : String(m.matchId);
                m.clipsCount = matchIdVal ? await Clip.countDocuments({ matchId: matchIdVal, ...Object.fromEntries(Object.entries(filter).filter(([k]) => k.startsWith("labels."))) }) : 0;
            }
            allMatches.sort((a, b) => (sort === "clipsDesc" ? b.clipsCount - a.clipsCount : a.clipsCount - b.clipsCount));
            matches = allMatches.slice(skip, skip + pageSize);
        } else {
            // normal DB pagination (sorted by date)
            matches = await Matches.find(filter).sort(sortSpec).skip(skip).limit(pageSize).lean();
            for (let i = 0; i < matches.length; i++) {
                const m = matches[i];
                const matchIdVal = m.matchId === undefined || m.matchId === null ? null : String(m.matchId);
                const labelFilters = Object.fromEntries(Object.entries(filter).filter(([k]) => k.startsWith("labels.")));
                m.clipsCount = matchIdVal ? await Clip.countDocuments({ matchId: matchIdVal, ...labelFilters }) : 0;
            }
        }

        return res.json({
            total,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
            matches,
        });
    } catch (err) {
        console.error("Error fetching matches with clips:", err);
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
            const filePath = path.join(__dirname, "..", "D:/fango11/fango11/allclips_lost", path.basename(clip.clip));
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
        // Accept either raw array or { clips: [...] }
        const raw = Array.isArray(req.body) ? req.body : req.body.clips;
        if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ success: false, message: "No clips provided" });
        }

        // Normalize items
        const clips = raw.map((c) => {
            const item = { ...c };
            if (item.matchId !== undefined && item.matchId !== null) item.matchId = String(item.matchId);
            if (!item.createdAt) item.createdAt = new Date();
            return item;
        });

        // Insert - don't stop on first error (ordered: false)
        const inserted = await Clip.insertMany(clips, { ordered: false });

        return res.status(201).json({
            success: true,
            insertedCount: inserted.length,
            insertedIds: inserted.map((d) => d._id),
        });
    } catch (err) {
        // Partial success handling: insertedDocs may exist when ordered:false
        const insertedCount = (err && err.insertedDocs && Array.isArray(err.insertedDocs)) ? err.insertedDocs.length : 0;
        console.error("bulk-insert error:", err.message || err);
        return res.status(500).json({
            success: false,
            message: "Bulk insert failed",
            insertedCount,
            error: err.message || String(err),
        });
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
        await Clip.deleteMany({ _id: { $in: clips } });

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

// GET /allclips?search=&batsman=&bowler=&matchType=&series=&shotType=&direction=&page=1&limit=10&sort=desc
router.get("/all_clips", async (req, res) => {
    try {
        const {
            search = "",
            batsman,
            bowler,
            event,
            matchType,
            series,
            batting_team,
            bowling_team,
            battingHand,
            bowlingHand,
            bowlerType,
            season,
            shotType,
            direction,
            ballType,
            lengthType,
            connection,
            slowball,
            lofted,
            comesDown,
            powerplay,
            isCleanBowled,
            isLBW,
            isStumping,
            isRunout,
            isCatch,
            page = 1,
            limit = 20,
            sort = "desc",
        } = req.query;
        // Build filter dynamically
        const filter = {};
        console.log(event, 'event')

        // 🔍 Text search across multiple fields (including labels)
        if (search) {
            filter.$or = [
                { event: { $regex: "FOUR", $options: "i" } },
                { commentary: { $regex: search, $options: "i" } },
                { subEvent: { $regex: search, $options: "i" } },
                { batsman: { $regex: search, $options: "i" } },
                { bowler: { $regex: search, $options: "i" } },
                { batting_team: { $regex: search, $options: "i" } },
                { bowling_team: { $regex: search, $options: "i" } },
                { series: { $regex: search, $options: "i" } },
                { matchType: { $regex: search, $options: "i" } },
                { "labels.shotType": { $regex: search, $options: "i" } },
                { "labels.direction": { $regex: search, $options: "i" } },
                { "labels.ballType": { $regex: search, $options: "i" } },
                { "labels.lengthType": { $regex: search, $options: "i" } },
                { "labels.connection": { $regex: search, $options: "i" } },
                { "labels.slowball": { $regex: search, $options: "i" } },
                { "labels.comesDown": { $regex: search, $options: "i" } },
                { "labels.powerplay": { $regex: search, $options: "i" } },
            ];
        }

        // 🎯 Field-based filters (both top-level and nested)
        if (event) filter.event = { $regex: event, $options: "i" };
        if (batsman) filter.batsman = { $regex: batsman, $options: "i" };
        if (bowler) filter.bowler = { $regex: bowler, $options: "i" };
        if (matchType) filter.matchType = matchType;
        if (series) filter.series = { $regex: series, $options: "i" };
        if (season) filter.season = { $regex: season, $options: "i" };
        if (batting_team) filter.batting_team = { $regex: batting_team, $options: "i" };
        if (bowling_team) filter.bowling_team = { $regex: bowling_team, $options: "i" };
        if (battingHand) filter.battingHand = { $regex: battingHand, $options: "i" };
        if (bowlingHand) filter.bowlingHand = { $regex: bowlingHand, $options: "i" };
        if (bowlerType) filter.bowlerType = { $regex: bowlerType, $options: "i" };
        if (shotType) filter["labels.shotType"] = { $regex: shotType, $options: "i" };
        if (direction) filter["labels.direction"] = { $regex: direction, $options: "i" };
        if (ballType) filter["labels.ballType"] = { $regex: ballType, $options: "i" };
        if (lengthType) filter["labels.lengthType"] = { $regex: lengthType, $options: "i" };
        if (connection) filter["labels.connection"] = { $regex: connection, $options: "i" };
        if (slowball) filter["labels.slowball"] = { $regex: slowball, $options: "i" };
        if (comesDown) filter["labels.comesDown"] = { $regex: comesDown, $options: "i" };
        if (powerplay) filter["labels.powerplay"] = { $regex: powerplay, $options: "i" };
        if (isCleanBowled) filter["labels.wicketType"] = "bowled";
        if (isLBW) filter["labels.wicketType"] = "lbw";
        if (isStumping) filter["labels.wicketType"] = "stumped";
        if (isRunout) filter["labels.wicketType"] = "runout";
        if (isCatch) filter["labels.wicketType"] = "caught";
        // Boolean filter for lofted
        if (lofted !== undefined) filter["labels.lofted"] = lofted === "true";

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch clips
        const clips = await Clip.find(filter)
            .sort({ createdAt: sort === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Total count for pagination
        const total = await Clip.countDocuments(filter);

        res.json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            clips,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/all_players", async (req, res) => {
    try {
        const players = await Player.find();
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const Series = require("../models/series");
const Match = require("../models/match");

// GET /series/completed - completed & important series with clips info
router.get("/series/completed", async (req, res) => {
    try {
        const { teamHomeName, teamAwayName,
            ballType, shotType, direction, lengthType, connection, slowball, lofted, comesDown, powerplay,
            season, fromDate, type, toDate, page = 1, limit = 20, perClipLimit = 3, includeClips = "false"
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const pageSize = Math.max(1, parseInt(limit, 10));
        const skip = (pageNum - 1) * pageSize;
        const include = includeClips === "true";
        const perLimit = Math.max(1, parseInt(perClipLimit, 10));

        // Label filters for clips
        const labelFilters = {};
        if (ballType) labelFilters["labels.ballType"] = { $regex: ballType, $options: "i" };
        if (shotType) labelFilters["labels.shotType"] = { $regex: shotType, $options: "i" };
        if (direction) labelFilters["labels.direction"] = { $regex: direction, $options: "i" };
        if (lengthType) labelFilters["labels.lengthType"] = { $regex: lengthType, $options: "i" };
        if (connection) labelFilters["labels.connection"] = { $regex: connection, $options: "i" };
        if (slowball) labelFilters["labels.slowball"] = { $regex: slowball, $options: "i" };
        if (comesDown) labelFilters["labels.comesDown"] = { $regex: comesDown, $options: "i" };
        if (powerplay) labelFilters["labels.powerplay"] = { $regex: powerplay, $options: "i" };
        if (lofted !== undefined) labelFilters["labels.lofted"] = lofted === "true";

        // Only completed and important series
        const now = new Date();
        const seriesFilter = {
            endDate: { $lte: now }, importance: { $ne: "low" }
        };

        // Optionally filter by season/date
        if (season) seriesFilter.season = season;
        if (fromDate || toDate) {
            seriesFilter.endDate = seriesFilter.endDate || {};
            if (fromDate) seriesFilter.endDate.$gte = new Date(fromDate);
            if (toDate) seriesFilter.endDate.$lte = new Date(toDate);
        }
        let matchFilter = {};
        if (teamHomeName) matchFilter.teamHomeName = teamHomeName;
        if (teamAwayName) matchFilter.teamAwayName = teamAwayName;
        if (type) matchFilter.type = type;

        let matches = [];
        matches = await Match.find(matchFilter);
        if (matches.length > 0) {
            const seriesIds = matches.map(m => String(m.seriesId));
            seriesFilter.seriesId = { $in: seriesIds };
        }
        // Get all completed & important series (paginated)
        const allSeries = await Series.find(seriesFilter).sort({ endDate: -1 }).lean();
        const pagedSeries = allSeries;

        const seriesResults = [];
        for (const series of pagedSeries) {
            // Find all matches for this series
            const matches = await Matches.find({ seriesId: String(series.seriesId) }).lean();
            if (!matches.length) continue;

            const matchIds = matches.map(m => String(m.matchId));
            const homeTeams = [...new Set(matches.map(m => m.teamHomeName).filter(Boolean))];
            const awayTeams = [...new Set(matches.map(m => m.teamAwayName).filter(Boolean))];

            // Count clips for this series (with label filters)
            const clipsCount = await Clip.countDocuments({
                matchId: { $in: matchIds },
                ...labelFilters
            });

            // Optionally include sample clips
            let clips = [];
            if (include && clipsCount > 0) {
                clips = await Clip.find({
                    matchId: { $in: matchIds },
                    ...labelFilters
                })
                    .sort({ createdAt: -1 })
                    .limit(perLimit)
                    .lean();
            }

            seriesResults.push({
                seriesId: series.seriesId,
                name: series.name,
                endDate: series.endDate,
                homeTeams,
                awayTeams,
                clipsCount,
                clips,
            });
        }

        res.json({
            total: allSeries.length,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(allSeries.length / pageSize),
            series: seriesResults,
        });
    } catch (err) {
        console.error("Error fetching completed series with clips:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;