const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
  {
    seriesId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['international', 'league', 'domestic', 'women'],
      required: true,
      default: 'international',
    },
    date: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Series = mongoose.model("Series", seriesSchema);

module.exports = Series;
