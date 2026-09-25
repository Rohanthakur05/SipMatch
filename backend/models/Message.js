const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters.'],
    },
    messageType: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Only createdAt — no updatedAt needed for immutable messages
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary: fetch all messages for a match in time order (most common query)
messageSchema.index({ match: 1, createdAt: 1 });

// Secondary: find unread messages for a receiver
messageSchema.index({ receiver: 1, read: 1 });

// Sender lookup (for future moderation/delete)
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
