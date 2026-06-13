const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    // Exactly two users per match
    users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (v) => v.length === 2,
        message: 'A match must have exactly 2 users.',
      },
      required: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Cached compatibility so we don't recalculate on every fetch
    compatibility: {
      score: { type: Number, default: 0 },
      reasons: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

// Index so we can quickly find all matches for a user
matchSchema.index({ users: 1 });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
