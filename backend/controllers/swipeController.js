const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const { calculateCompatibility } = require('../utils/compatibilityEngine');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Record a swipe and create a match on mutual like/superlike
// @route POST /api/swipes
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const recordSwipe = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;
    const swiperId = req.user.id;

    if (!targetUserId || !action) {
      return res
        .status(400)
        .json({ message: 'targetUserId and action are required.' });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res
        .status(400)
        .json({ message: 'action must be like, pass, or superlike.' });
    }

    if (swiperId === targetUserId) {
      return res.status(400).json({ message: 'Cannot swipe on yourself.' });
    }

    // Upsert swipe (user might change their mind if re-implemented later)
    const swipe = await Swipe.findOneAndUpdate(
      { swiper: swiperId, targetUser: targetUserId },
      { action },
      { upsert: true, new: true }
    );

    // Passes never create matches
    if (action === 'pass') {
      return res.json({ matchCreated: false, swipe });
    }

    // Check if the target user already liked/superliked the current user
    const reverseSwipe = await Swipe.findOne({
      swiper: targetUserId,
      targetUser: swiperId,
      action: { $in: ['like', 'superlike'] },
    });

    if (!reverseSwipe) {
      return res.json({ matchCreated: false, swipe });
    }

    // ── Mutual like → create match if one doesn't already exist ──────────────
    const existingMatch = await Match.findOne({
      users: { $all: [swiperId, targetUserId] },
    });

    if (existingMatch) {
      return res.json({ matchCreated: false, swipe, message: 'Already matched.' });
    }

    // Calculate and cache compatibility
    const [userA, userB] = await Promise.all([
      User.findById(swiperId),
      User.findById(targetUserId),
    ]);

    const compat = calculateCompatibility(userA, userB);

    const match = await Match.create({
      users: [swiperId, targetUserId],
      compatibility: { score: compat.score, reasons: compat.reasons },
    });

    // Populate for the response
    const populatedMatch = await Match.findById(match._id).populate(
      'users',
      'name primaryPhoto profilePhotos age location'
    );

    return res.status(201).json({
      matchCreated: true,
      match: populatedMatch,
      compatibility: compat,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get the discover feed (filtered, paginated)
// @route GET /api/discover?page=1&limit=10
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getDiscoverFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. IDs the user has already swiped on
    const alreadySwiped = await Swipe.find({ swiper: currentUserId }).select(
      'targetUser'
    );
    const swipedIds = alreadySwiped.map((s) => s.targetUser);

    // 2. IDs already matched with
    const existingMatches = await Match.find({
      users: currentUserId,
    }).select('users');
    const matchedIds = existingMatches.flatMap((m) =>
      m.users.filter((u) => u.toString() !== currentUserId)
    );

    // 3. Excluded IDs = self + swiped + matched
    const excludedIds = [currentUserId, ...swipedIds, ...matchedIds];

    // 4. Query remaining users
    const users = await User.find({ _id: { $nin: excludedIds } })
      .select('-password -email')
      .skip(skip)
      .limit(limit)
      .lean();

    // 5. Attach compatibility score to each card
    const currentUser = await User.findById(currentUserId);
    const feed = users.map((u) => {
      const compat = calculateCompatibility(currentUser, u);
      return { ...u, compatibility: compat };
    });

    const total = await User.countDocuments({ _id: { $nin: excludedIds } });

    res.json({
      feed,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all matches for the current user
// @route GET /api/matches
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getMatches = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const matches = await Match.find({ users: currentUserId })
      .populate('users', 'name primaryPhoto profilePhotos age location')
      .sort({ lastActivity: -1 })
      .lean();

    // Shape the response: hide current user, expose the matched partner
    const shaped = matches.map((m) => {
      const partner = m.users.find((u) => u._id.toString() !== currentUserId);
      return {
        matchId: m._id,
        matchedAt: m.matchedAt,
        lastMessage: m.lastMessage,
        lastActivity: m.lastActivity,
        partner,
        compatibility: m.compatibility,
      };
    });

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordSwipe, getDiscoverFeed, getMatches };
