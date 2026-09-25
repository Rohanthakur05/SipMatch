const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema(
  {
    swiper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['like', 'pass', 'superlike'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index – one swipe record per (swiper, target) pair
swipeSchema.index({ swiper: 1, targetUser: 1 }, { unique: true });
// Index for fast reverse-swipe look-ups
swipeSchema.index({ targetUser: 1, swiper: 1 });
// Index for feed exclusion queries
swipeSchema.index({ swiper: 1, action: 1 });

// Pre-save guard: users cannot swipe on themselves
swipeSchema.pre('save', function (next) {
  if (this.swiper.toString() === this.targetUser.toString()) {
    return next(new Error('Cannot swipe on yourself.'));
  }
  next();
});

const Swipe = mongoose.model('Swipe', swipeSchema);
module.exports = Swipe;
