const mongoose = require('mongoose');
const Message  = require('../models/Message');
const Match    = require('../models/Match');

const MAX_CONTENT_LENGTH = 2000;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: verify authenticated user is a participant in the match.
// Returns the match document if valid, throws otherwise.
// ─────────────────────────────────────────────────────────────────────────────
const assertParticipant = async (matchId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    const err = new Error('Invalid matchId.');
    err.statusCode = 400;
    throw err;
  }

  const match = await Match.findById(matchId).lean();
  if (!match) {
    const err = new Error('Match not found.');
    err.statusCode = 404;
    throw err;
  }

  const ids = match.users.map((u) => u.toString());
  if (!ids.includes(userId.toString())) {
    const err = new Error('Not authorised to access this conversation.');
    err.statusCode = 403;
    throw err;
  }

  return { match, ids };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get messages for a match (paginated, chronological)
// @route GET /api/messages/:matchId?page=1&limit=50
// @access Private — participants only
// ─────────────────────────────────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const userId  = (req.user._id || req.user.id).toString();
    const { matchId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    await assertParticipant(matchId, userId);

    const [messages, total] = await Promise.all([
      Message.find({ match: matchId })
        .select('-__v')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ match: matchId }),
    ]);

    // Mark unread messages addressed to this user as read
    await Message.updateMany(
      { match: matchId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      messages,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Send a message via HTTP (Socket.io is preferred for real-time delivery)
// @route POST /api/messages/:matchId
// @access Private — participants only
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const senderId = (req.user._id || req.user.id).toString();
    const { matchId } = req.params;
    const { content } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ success: false, message: `Message too long (max ${MAX_CONTENT_LENGTH} chars).` });
    }

    const { match, ids } = await assertParticipant(matchId, senderId);
    const receiverId = ids.find((id) => id !== senderId);

    // ── Save message ──────────────────────────────────────────────────────────
    const message = await Message.create({
      match:   matchId,
      sender:  senderId,
      receiver: receiverId,
      content:  content.trim(),
      messageType: 'text',
    });

    // ── Update match lastMessage / lastActivity ───────────────────────────────
    await Match.findByIdAndUpdate(matchId, {
      lastMessage:  content.trim().slice(0, 100),
      lastActivity: new Date(),
    });

    return res.status(201).json({ success: true, message });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

module.exports = { getMessages, sendMessage };
