/**
 * badgeEngine.js
 * Calculates the personalityBadge label from a user's preference profile.
 * Used on both backend (on save) and mirrored on frontend (live preview).
 */

const BADGE_RULES = [
  {
    badge: '🥃 Whiskey Connoisseur',
    test: (u) =>
      matchesAny(u.drinkPreferences, ['Whiskey', 'Bourbon', 'Rye', 'Scotch']) ||
      matchesAny([u.favoriteDrink], ['Whiskey', 'Bourbon', 'Old Fashioned', 'Manhattan']),
  },
  {
    badge: '🍸 Cocktail Explorer',
    test: (u) =>
      matchesAny(u.drinkPreferences, ['Cocktails']) ||
      matchesAny(u.nightOutStyle, ['Cocktail Lounge']) ||
      matchesAny([u.firstRoundOrder], ['Margarita', 'Cosmopolitan', 'Mojito', 'Negroni']),
  },
  {
    badge: '🍺 Craft Beer Hunter',
    test: (u) =>
      matchesAny(u.drinkPreferences, ['Beer']) ||
      matchesAny(u.nightOutStyle, ['Craft Beer Taproom']) ||
      matchesAny([u.firstRoundOrder], ['IPA', 'Stout', 'Beer Pitcher']),
  },
  {
    badge: '🍷 Wine Enthusiast',
    test: (u) =>
      matchesAny(u.drinkPreferences, ['Wine']) ||
      matchesAny(u.nightOutStyle, ['Wine Tasting']) ||
      matchesAny([u.firstRoundOrder], ['Red Wine', 'White Wine', 'Rosé']),
  },
  {
    badge: '🎉 Weekend Party Starter',
    test: (u) =>
      matchesAny([u.drinkingMoment], ['Weekend Warrior']) ||
      matchesAny(u.nightOutStyle, ['Club & Dance Floor']) ||
      matchesAny([u.socialVibe], ['Life of the Party']),
  },
  {
    badge: '🎶 Happy Hour Hero',
    test: (u) =>
      matchesAny(u.nightOutStyle, ['Live Music Venue']) ||
      matchesAny([u.drinkingMoment], ['Live Music Lover']) ||
      matchesAny(u.musicPreferences, ['Jazz', 'Rock', 'Blues']),
  },
  {
    badge: '🌙 Midnight Mixer',
    test: (u) => matchesAny([u.drinkingMoment], ['Night Owl']),
  },
  {
    badge: '🌅 Sunset Sipper',
    test: (u) => matchesAny([u.drinkingMoment], ['Sunset Sipper']),
  },
  {
    badge: '🍹 Mixology Master',
    test: (u) =>
      (u.drinkPreferences || []).length >= 4 ||
      matchesAny([u.signatureSip], ['Mojito', 'Cosmopolitan', 'Negroni', 'Long Island']),
  },
  {
    badge: '🌇 Rooftop Regular',
    test: (u) => matchesAny(u.nightOutStyle, ['Rooftop Bar']),
  },
  {
    badge: '🥂 Social Sipper',
    test: (u) =>
      matchesAny([u.socialVibe], ['Social Butterfly', 'Easy Going', 'Chill & Relaxed']),
  },
  {
    badge: '🌟 Adventure Seeker',
    test: (u) => matchesAny([u.socialVibe], ['Adventure Seeker']),
  },
];

// Case-insensitive partial match
const matchesAny = (haystack = [], needles = []) => {
  const lower = (arr) => arr.map((s) => (s || '').toLowerCase());
  return lower(haystack).some((h) =>
    lower(needles).some((n) => h.includes(n) || n.includes(h))
  );
};

/**
 * @param {Object} user - User document or plain object with preference fields
 * @returns {string} badge label, e.g. "🥃 Whiskey Connoisseur"
 */
const calculateBadge = (user) => {
  for (const rule of BADGE_RULES) {
    if (rule.test(user)) return rule.badge;
  }
  return '🍻 SipMatch Explorer'; // default
};

module.exports = { calculateBadge };
