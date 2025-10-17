const mongoose = require("mongoose");

const CommentarySchema = new mongoose.Schema({
    ballNbr: { type: Number, required: true },
    batTeamName: { type: String, required: true },
    batTeamScore: { type: String, required: true },
    batsmanStriker: {
        batId: { type: Number },
        batName: { type: String },
        batRuns: { type: Number },
        batBalls: { type: Number },
        batFours: { type: Number },
        batSixes: { type: Number },
        batStrikeRate: { type: Number },
    },
    bowlerStriker: {
        bowlId: { type: Number },
        bowlName: { type: String },
        bowlOvers: { type: Number },
        bowlRuns: { type: Number },
        bowlWkts: { type: Number },
        bowlEcon: { type: Number },
        bowlMaidens: { type: Number },
    },
    commText: { type: String }, // 👈 actual commentary line
    commentaryFormats: { type: Array, default: [] },
    event: { type: String },
    inningsId: { type: Number },
    overNumber: { type: Number },
    timestamp: { type: Number },
    overSeparator: { type: Object, default: {} }, // 👈 over summary object
});

const matchCommentarySchema = new mongoose.Schema(
    {
        matchId: {
            type: String,
            trim: true,
            required: true,
            unique: true,
            lowercase: true,
        },
        format: {
            type: String,
            enum: ['test', 'odi', 't20', 't10'],
            default: 't20',
        },
        type: {
            type: String,
            enum: ['i', 'd', 'l'],
            default: 'i',
        },
        teamHomeId: {
            type: String,
            trim: true,
            required: true,
            lowercase: true,
            default: "",
        },
        teamHomeFlagUrl: {
            type: String,
            trim: true,
            default: "",
        },
        teamAwayFlagUrl: {
            type: String,
            trim: true,
            default: "",
        },
        teamAwayId: {
            type: String,
            trim: true,
            default: "",
        },
        isInPlay: {
            type: Boolean,
            default: false,
        },
        teamHomeCommentary: [CommentarySchema], // 👈 array of commentary per ball
        teamAwayCommentary: [CommentarySchema], // 👈 same for away
        date: {
            type: Date,
            required: true,
        },
        inPlay: {
            type: String,
        },
        status: {
            type: String,
        },
        toss: {
            type: String,
        },
        result: {
            type: String,
        },
        transaction: {
            type: Boolean,
            default: false,
        },
        cryptoTransaction: {
            type: Boolean,
            default: false,
        },
        isHomeFirst: {
            type: Boolean,
            required: true,
            default: false,
        },
        titleFI: {
            type: String,
        },
        oversFI: {
            type: Number,
        },
        runFI: {
            type: Number,
        },
        wicketsFI: {
            type: String,
        },
        fowFI: {
            type: String,
        },
        extrasDetailFI: {
            type: String,
        },
        titleSI: {
            type: String,
        },
        oversSI: {
            type: Number,
        },
        runSI: {
            type: Number,
        },
        wicketsSI: {
            type: String,
        },
        fowSI: {
            type: String,
        },
        extrasDetailSI: {
            type: String,
        },
        wicketsDataFI: {
            type: Array,
            default: [],
        },
        wicketsDataSI: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const MatchLiveCommentary = mongoose.model("MatchLiveCommentary", matchCommentarySchema);
module.exports = MatchLiveCommentary;
