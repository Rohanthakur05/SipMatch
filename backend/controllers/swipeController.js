const mongoose = require('mongoose');
const User  = require('../models/User');
const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const { calculateCompatibility } = require('../utils/compatibilityEngine');

// ─────────────────────────────────────────────────────────────────────────────
// Minimum profile completeness requirements for the Discover feed
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_REQUIREMENTS = {
  minPhotos:            4,
  requireBio:           true,
  requireDrinkPrefs:    true,
  requirePersonality:   true, // at least one of: signatureSip, drinkingMoment, nightOutStyle, socialVibe
};

const isProfileComplete = (user) => {
  const photos = user.profilePhotos || [];
  if (photos.length < PROFILE_REQUIREMENTS.minPhotos) return false;
  if (PROFILE_REQUIREMENTS.requireBio && !user.bio)   return false;
  if (PROFILE_REQUIREMENTS.requireDrinkPrefs && (!user.drinkPreferences || user.drinkPreferences.length === 0)) return false;
  if (PROFILE_REQUIREMENTS.requirePersonality) {
    const hasPersonality =
      user.signatureSip   ||
      user.drinkingMoment ||
      (user.nightOutStyle && user.nightOutStyle.length > 0) ||
      user.socialVibe;
    if (!hasPersonality) return false;
  }
  return true;
};

// Safe fields to expose on a profile card (never expose password / email / tokens)
const SAFE_SELECT =
  '-password -email -__v';

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get the discover feed (filtered, paginated, completeness-gated)
// @route GET /api/discover?page=1&limit=10&ageMin=18&ageMax=35
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getDiscoverFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    // ── Optional filters (architecture prepared for future expansion) ─────────
    const filters = {};
    if (req.query.ageMin || req.query.ageMax) {
      filters.age = {};
      if (req.query.ageMin) filters.age.$gte = parseInt(req.query.ageMin);
      if (req.query.ageMax) filters.age.$lte = parseInt(req.query.ageMax);
    }
    if (req.query.nightOutStyle) {
      filters.nightOutStyle = { $in: req.query.nightOutStyle.split(',') };
    }
    if (req.query.socialVibe) {
      filters.socialVibe = req.query.socialVibe;
    }
    if (req.query.drinkPrefs) {
      filters.drinkPreferences = { $in: req.query.drinkPrefs.split(',') };
    }
    if (req.query.musicPref) {
      filters.musicPreferences = { $in: req.query.musicPref.split(',') };
    }

    // ── 1. IDs already swiped on ──────────────────────────────────────────────
    const alreadySwiped = await Swipe.find({ swiper: currentUserId }).select('targetUser').lean();
    const swipedIds = alreadySwiped.map((s) => s.targetUser);

    // ── 2. IDs already matched with ───────────────────────────────────────────
    const existingMatches = await Match.find({ users: currentUserId }).select('users').lean();
    const matchedIds = existingMatches.flatMap((m) =>
      m.users.filter((u) => u.toString() !== currentUserId.toString())
    );

    // ── 3. Exclude: self + swiped + matched ───────────────────────────────────
    const excludedIds = [currentUserId, ...swipedIds, ...matchedIds];

    // ── 4. Build query: profile completeness is enforced server-side ──────────
    const query = {
      _id: { $nin: excludedIds },
      // Must have at minimum 4 photos (stored in profilePhotos array)
      [`profilePhotos.${PROFILE_REQUIREMENTS.minPhotos - 1}`]: { $exists: true },
      // Must have a non-empty bio
      bio: { $exists: true, $ne: '' },
      // Must have at least one drink preference
      drinkPreferences: { $exists: true, $not: { $size: 0 } },
      // Must have at least one personality field filled
      $or: [
        { signatureSip:   { $exists: true, $ne: '' } },
        { drinkingMoment: { $exists: true, $ne: '' } },
        { socialVibe:     { $exists: true, $ne: '' } },
        { nightOutStyle:  { $exists: true, $not: { $size: 0 } } },
      ],
      // Merge any optional filter params
      ...filters,
    };

    const [users, total] = await Promise.all([
      User.find(query).select(SAFE_SELECT).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // ── 5. Attach per-card compatibility score ────────────────────────────────
    const currentUser = await User.findById(currentUserId).lean();
    const feed = users.map((u) => {
      const compat = calculateCompatibility(currentUser, u);
      return { ...u, compatibility: compat };
    });

    return res.json({
      success: true,
      feed,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('[getDiscoverFeed]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Record a swipe; create a match on mutual like / superlike
// @route POST /api/swipes
// @access Private
// Body: { targetUserId: string, action: 'like' | 'pass' | 'superlike' }
// ─────────────────────────────────────────────────────────────────────────────
const recordSwipe = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;
    const swiperId = (req.user._id || req.user.id).toString();

    // ── Input validation ──────────────────────────────────────────────────────
    if (!targetUserId || !action) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId and action are required.',
      });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be like, pass, or superlike.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetUserId.' });
    }

    if (swiperId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot swipe on yourself.' });
    }

    // ── Verify target user exists ─────────────────────────────────────────────
    const targetExists = await User.exists({ _id: targetUserId });
    if (!targetExists) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    // ── Upsert swipe (idempotent – changing mind is fine) ─────────────────────
    const swipe = await Swipe.findOneAndUpdate(
      { swiper: swiperId, targetUser: targetUserId },
      { action },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Passes never create matches ───────────────────────────────────────────
    if (action === 'pass') {
      return res.json({ success: true, matchCreated: false, swipe });
    }

    // ── Check for a reverse like / superlike ─────────────────────────────────
    const reverseSwipe = await Swipe.findOne({
      swiper: targetUserId,
      targetUser: swiperId,
      action: { $in: ['like', 'superlike'] },
    });

    if (!reverseSwipe) {
      return res.json({ success: true, matchCreated: false, swipe });
    }

    // ── Mutual like → guard against duplicate match ───────────────────────────
    const sortedUsers = [swiperId, targetUserId].sort();
    const existingMatch = await Match.findOne({
      users: { $all: sortedUsers, $size: 2 },
    });

    if (existingMatch) {
      return res.json({
        success: true,
        matchCreated: false,
        swipe,
        message: 'Already matched.',
      });
    }

    // ── Calculate compatibility before creating match ─────────────────────────
    const [userA, userB] = await Promise.all([
      User.findById(swiperId).lean(),
      User.findById(targetUserId).lean(),
    ]);

    const compat = calculateCompatibility(userA, userB);

    // ── Create the match ──────────────────────────────────────────────────────
    const match = await Match.create({
      users: sortedUsers,
      compatibilityScore:   compat.score,
      compatibilityReasons: compat.reasons,
      // Also write to the legacy nested field for backwards compat
      compatibility: { score: compat.score, reasons: compat.reasons },
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('users', 'name primaryPhoto profilePhotos age location personalityBadge signatureSip')
      .lean();

    return res.status(201).json({
      success: true,
      matchCreated: true,
      match:         populatedMatch,
      compatibility: compat,
    });
  } catch (error) {
    // Duplicate key = race condition where two simultaneous swipes both tried to create
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Swipe already recorded.',
      });
    }
    console.error('[recordSwipe]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all matches for the current user
// @route GET /api/matches
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getMatches = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    const matches = await Match.find({ users: currentUserId })
      .populate(
        'users',
        'name primaryPhoto profilePhotos age location personalityBadge signatureSip socialVibe nightOutStyle'
      )
      .sort({ lastActivity: -1 })
      .lean();

    const shaped = matches.map((m) => {
      const partner = m.users.find((u) => u._id.toString() !== currentUserId);
      return {
        matchId:             m._id,
        matchedAt:           m.matchedAt,
        lastMessage:         m.lastMessage,
        lastActivity:        m.lastActivity,
        partner,
        compatibilityScore:   m.compatibilityScore   || m.compatibility?.score   || 0,
        compatibilityReasons: m.compatibilityReasons || m.compatibility?.reasons || [],
      };
    });

    return res.json({ success: true, matches: shaped });
  } catch (error) {
    console.error('[getMatches]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get a single match by ID (must be a participant)
// @route GET /api/matches/:matchId
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getMatchById = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const { matchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ success: false, message: 'Invalid matchId.' });
    }

    const match = await Match.findById(matchId)
      .populate(
        'users',
        'name primaryPhoto profilePhotos age location bio personalityBadge signatureSip drinkingMoment nightOutStyle socialVibe interests musicPreferences drinkPreferences prompts'
      )
      .lean();

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    // Security: only participants can read this match
    const isParticipant = match.users.some((u) => u._id.toString() === currentUserId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorised to view this match.' });
    }

    const partner = match.users.find((u) => u._id.toString() !== currentUserId);
    const self    = match.users.find((u) => u._id.toString() === currentUserId);

    return res.json({
      success: true,
      match: {
        matchId:             match._id,
        matchedAt:           match.matchedAt,
        lastMessage:         match.lastMessage,
        lastActivity:        match.lastActivity,
        compatibilityScore:   match.compatibilityScore   || match.compatibility?.score   || 0,
        compatibilityReasons: match.compatibilityReasons || match.compatibility?.reasons || [],
        partner,
        self,
      },
    });
  } catch (error) {
    console.error('[getMatchById]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { recordSwipe, getDiscoverFeed, getMatches, getMatchById };
