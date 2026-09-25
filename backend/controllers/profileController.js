const User  = require('../models/User');
const Match = require('../models/Match');
const Swipe = require('../models/Swipe');
const { calculateBadge } = require('../utils/badgeEngine');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Save / update personality fields and recalculate badge
// @route PUT /api/profile/personality
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const updatePersonality = async (req, res) => {
  try {
    const {
      signatureSip, drinkingMoment, nightOutStyle, socialVibe,
      firstRoundOrder, prompts,
      drinkPreferences, favoriteDrink, drinkingHabits,
      interests, musicPreferences,
      bio, age, gender, location,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (signatureSip    !== undefined) user.signatureSip    = signatureSip;
    if (drinkingMoment  !== undefined) user.drinkingMoment  = drinkingMoment;
    if (nightOutStyle   !== undefined) user.nightOutStyle   = nightOutStyle;
    if (socialVibe      !== undefined) user.socialVibe      = socialVibe;
    if (firstRoundOrder !== undefined) user.firstRoundOrder = firstRoundOrder;
    if (prompts         !== undefined) user.prompts         = prompts;
    if (drinkPreferences!== undefined) user.drinkPreferences= drinkPreferences;
    if (favoriteDrink   !== undefined) user.favoriteDrink   = favoriteDrink;
    if (drinkingHabits  !== undefined) user.drinkingHabits  = drinkingHabits;
    if (interests       !== undefined) user.interests       = interests;
    if (musicPreferences!== undefined) user.musicPreferences= musicPreferences;
    if (bio             !== undefined) user.bio             = bio;
    if (age             !== undefined) user.age             = age;
    if (gender          !== undefined) user.gender          = gender;
    if (location        !== undefined) user.location        = location;

    user.personalityBadge = calculateBadge(user);
    await user.save();

    const updated = user.toObject();
    delete updated.password;

    res.json({ message: 'Personality updated.', user: updated, personalityBadge: user.personalityBadge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get full profile of current user (no password)
// @route GET /api/profile/me
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get profile activity stats (likes received, matches, conversations)
// @route GET /api/profile/stats
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [likesReceived, matchCount] = await Promise.all([
      // Likes received = swipes where targetUser is me and action is like or superlike
      Swipe.countDocuments({ targetUser: userId, action: { $in: ['like', 'superlike'] } }),
      // Matches count
      Match.countDocuments({ users: userId }),
    ]);

    res.json({ success: true, stats: { likesReceived, matchCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Save discovery preferences, notifications, and privacy settings
// @route PUT /api/profile/settings
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const updateSettings = async (req, res) => {
  try {
    const { discoveryPreferences, notifications, privacy, drinkPreferences, interests } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Merge nested objects rather than wholesale replace
    if (discoveryPreferences) {
      const dp = discoveryPreferences;
      if (dp.ageMin     !== undefined) user.discoveryPreferences.ageMin     = Number(dp.ageMin);
      if (dp.ageMax     !== undefined) user.discoveryPreferences.ageMax     = Number(dp.ageMax);
      if (dp.lookingFor !== undefined) user.discoveryPreferences.lookingFor  = dp.lookingFor;
    }

    if (notifications) {
      Object.keys(notifications).forEach((k) => {
        if (user.notifications[k] !== undefined) {
          user.notifications[k] = Boolean(notifications[k]);
        }
      });
    }

    if (privacy) {
      Object.keys(privacy).forEach((k) => {
        if (user.privacy[k] !== undefined) {
          user.privacy[k] = Boolean(privacy[k]);
        }
      });
    }

    // Allow saving drink prefs and interests from the settings page too
    if (drinkPreferences !== undefined) user.drinkPreferences = drinkPreferences;
    if (interests        !== undefined) user.interests        = interests;

    // Mark nested objects as modified (Mongoose doesn't auto-detect subdoc changes)
    user.markModified('discoveryPreferences');
    user.markModified('notifications');
    user.markModified('privacy');

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    res.json({ success: true, message: 'Settings saved.', user: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updatePersonality, getMyProfile, getProfileStats, updateSettings };
