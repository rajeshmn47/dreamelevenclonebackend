const mongoose = require('mongoose');

const CricketShotClipSchema = new mongoose.Schema({
  file: {
    type: String,
    required: true,
    unique: true,
  },
  team: {
    type: String,
    required: true,
    lowercase: true,
    trim: true, // batting team
  },
  opponentTeam: {
    type: String,
    required: true,
    lowercase: true,
    trim: true, // bowling team
  },
  batsman: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  bowler: {
    type: String,
    lowercase: true,
    trim: true,
    default: '',
  },
  shot: {
    type: String,
    required: true,
    lowercase: true,
    enum: [
      'four',
      'six',
      'wicket',
      'pullshot',
      'hook',
      'coverdrive',
      'straightdrive',
      'sweep',
      'reverse sweep',
      'cut',
      'glance',
      'uppercut',
      'helicopter',
      'paddle scoop',
      'lofted drive',
      'defensive',
      'other',
    ],
    default: 'other'
  },
  commentary: {
    type: String,
    trim: true,
    default: '',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CricketShotClip', CricketShotClipSchema);
