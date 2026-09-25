const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    // Exactly two users per match (stored as sorted pair for easy dedup)
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
    // Compatibility data – cached so we don't recalculate on every fetch
    compatibilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    compatibilityReasons: {
      type: [String],
      default: [],
    },
    // Legacy nested field kept for backwards compatibility during migration
    compatibility: {
      score: { type: Number, default: 0 },
      reasons: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

// Index so we can quickly find all matches for a user
matchSchema.index({ users: 1 });

// Index for sorting by recent activity
matchSchema.index({ lastActivity: -1 });

// Pre-save: sort the users array so [A, B] and [B, A] are treated identically.
// The unique sparse index below relies on this ordering.
matchSchema.pre('save', function (next) {
  if (this.isNew) {
    this.users = [...this.users].sort();
  }
  next();
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
