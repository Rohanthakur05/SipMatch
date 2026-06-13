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
  },
  { timestamps: true }
);

// Compound index – one swipe record per (swiper, target) pair
swipeSchema.index({ swiper: 1, targetUser: 1 }, { unique: true });

const Swipe = mongoose.model('Swipe', swipeSchema);
module.exports = Swipe;
