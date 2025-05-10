const mongoose = require("mongoose");
const crypto = require("crypto");

const squadSchema = new mongoose.Schema(
    {
        teamId: {
            type: Number,
            trim: true,
            required: true
        },
        squadId: {
            type: Number,
            trim: true,
            required: true
        },
        seriesId: {
            type: Number,
            trim: true,
            required: true
        },
        teamName: {
            type: String,
            trim: true,
            required: true,
        },
        players: [
            {
                playerId: {
                    type: String,
                    trim: true,
                    required: true,
                    lowercase: true,
                },

                playerName: {
                    type: String,
                    trim: true,
                    required: true,
                    lowercase: true,
                },

                position: {
                    type: String,
                    trim: true,
                    required: true,
                    lowercase: true,
                },

                image: {
                    type: String,
                    trim: true,
                    required: true,
                    lowercase: true,
                },
            },
        ],
    },
    
    {
        timestamps: true,
    }
);
const Squad = mongoose.model("Squad", squadSchema);
module.exports = Squad;
