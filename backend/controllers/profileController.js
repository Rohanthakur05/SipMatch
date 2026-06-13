const User = require('../models/User');
const { calculateBadge } = require('../utils/badgeEngine');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Save / update personality fields and recalculate badge
// @route PUT /api/profile/personality
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const updatePersonality = async (req, res) => {
  try {
    const {
      signatureSip,
      drinkingMoment,
      nightOutStyle,
      socialVibe,
      firstRoundOrder,
      prompts,
      // also accept core preference updates in the same call
      drinkPreferences,
      favoriteDrink,
      drinkingHabits,
      interests,
      musicPreferences,
      bio,
      age,
      gender,
      location,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Apply updates for any fields that were sent
    if (signatureSip   !== undefined) user.signatureSip   = signatureSip;
    if (drinkingMoment !== undefined) user.drinkingMoment = drinkingMoment;
    if (nightOutStyle  !== undefined) user.nightOutStyle  = nightOutStyle;
    if (socialVibe     !== undefined) user.socialVibe     = socialVibe;
    if (firstRoundOrder!== undefined) user.firstRoundOrder= firstRoundOrder;
    if (prompts        !== undefined) user.prompts        = prompts;

    // Core preference fields (also sent from onboarding completion)
    if (drinkPreferences !== undefined) user.drinkPreferences = drinkPreferences;
    if (favoriteDrink    !== undefined) user.favoriteDrink    = favoriteDrink;
    if (drinkingHabits   !== undefined) user.drinkingHabits   = drinkingHabits;
    if (interests        !== undefined) user.interests        = interests;
    if (musicPreferences !== undefined) user.musicPreferences = musicPreferences;
    if (bio              !== undefined) user.bio              = bio;
    if (age              !== undefined) user.age              = age;
    if (gender           !== undefined) user.gender           = gender;
    if (location         !== undefined) user.location         = location;

    // Auto-calculate badge from updated profile
    user.personalityBadge = calculateBadge(user);

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    res.json({
      message: 'Personality updated.',
      user: updated,
      personalityBadge: user.personalityBadge,
    });
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

module.exports = { updatePersonality, getMyProfile };
