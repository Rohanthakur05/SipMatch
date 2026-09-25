/**
 * compatibilityEngine.js — V3
 *
 * Multi-factor nightlife personality scoring system (100 pts max).
 * Weights are configurable via WEIGHTS constant.
 *
 * Breakdown:
 *   Drink compatibility  : 25 pts
 *   Nightlife personality: 25 pts
 *   Social vibe          : 15 pts
 *   Music preferences    : 15 pts
 *   Lifestyle interests  : 20 pts
 *   ─────────────────────────────
 *   Total possible       : 100 pts
 *
 * Every returned `reason` is derived from real matching profile data.
 * No fabricated reasons are ever returned.
 */

// ── Configurable weights (pts) ────────────────────────────────────────────────
const WEIGHTS = {
  drinkPreferences: 14,   // shared drink categories
  signatureSip:     11,   // exact sip match is a strong signal
  nightOutStyle:    15,   // shared venue / scene preference
  drinkingMoment:   10,   // shared "when they drink" personality
  socialVibe:       15,   // social energy alignment
  musicPreferences: 15,   // shared genres
  interests:        20,   // lifestyle interests (largest single bucket)
};
// Total cap: sum of all weights = 100

// ── Helpers ───────────────────────────────────────────────────────────────────
const intersect = (a = [], b = []) =>
  (a || []).filter((x) =>
    (b || []).map((y) => (y || '').toLowerCase()).includes((x || '').toLowerCase())
  );

const sameString = (a, b) =>
  !!(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

const cleanLabel = (str = '') =>
  str.replace(/^[^\w]+/, '').trim();

/**
 * Calculate compatibility between two users.
 *
 * @param {Object} userA – Mongoose user doc or lean plain object
 * @param {Object} userB – Mongoose user doc or lean plain object
 * @returns {{ score: number, reasons: string[] }}
 */
const calculateCompatibility = (userA, userB) => {
  let points = 0;
  const reasons = [];

  // ── 1. Shared drink preferences (14 pts) ──────────────────────────────────
  const sharedDrinks = intersect(userA.drinkPreferences, userB.drinkPreferences);
  if (sharedDrinks.length > 0) {
    const earned = Math.min(WEIGHTS.drinkPreferences, sharedDrinks.length * 5);
    points += earned;
    if (sharedDrinks.length === 1) {
      reasons.push(`You both enjoy ${sharedDrinks[0]}`);
    } else {
      reasons.push(`Both enjoy ${sharedDrinks.slice(0, 2).join(' & ')}`);
    }
  }

  // ── 2. Signature sip match (11 pts) ───────────────────────────────────────
  if (sameString(userA.signatureSip, userB.signatureSip) && userA.signatureSip) {
    points += WEIGHTS.signatureSip;
    reasons.push(`Same signature sip: ${userA.signatureSip}`);
  } else if (
    userA.favoriteDrink &&
    sameString(userA.favoriteDrink, userB.favoriteDrink)
  ) {
    // Legacy fallback for profiles using old favoriteDrink field
    points += Math.round(WEIGHTS.signatureSip * 0.6);
    reasons.push(`${userA.favoriteDrink} is a favourite for both`);
  }

  // ── 3. Night out style / venue preference (15 pts) ────────────────────────
  const sharedVenues = intersect(userA.nightOutStyle, userB.nightOutStyle);
  if (sharedVenues.length > 0) {
    const earned = Math.min(WEIGHTS.nightOutStyle, sharedVenues.length * 8);
    points += earned;
    if (sharedVenues.length === 1) {
      reasons.push(`You both love ${sharedVenues[0]}`);
    } else {
      reasons.push(`Both love ${sharedVenues.slice(0, 2).join(' & ')}`);
    }
  }

  // ── 4. Drinking moment / nightlife personality (10 pts) ───────────────────
  if (sameString(userA.drinkingMoment, userB.drinkingMoment) && userA.drinkingMoment) {
    points += WEIGHTS.drinkingMoment;
    reasons.push(`Same nightlife energy – both are ${cleanLabel(userA.drinkingMoment)}`);
  } else if (
    sameString(userA.drinkingHabits, userB.drinkingHabits) &&
    userA.drinkingHabits
  ) {
    // Legacy fallback
    points += Math.round(WEIGHTS.drinkingMoment * 0.5);
    reasons.push(`Same drinking frequency (${userA.drinkingHabits})`);
  }

  // ── 5. Social vibe alignment (15 pts) ─────────────────────────────────────
  if (sameString(userA.socialVibe, userB.socialVibe) && userA.socialVibe) {
    points += WEIGHTS.socialVibe;
    reasons.push(`Similar social vibe – both are ${cleanLabel(userA.socialVibe)}`);
  }

  // ── 6. Music preferences (15 pts) ─────────────────────────────────────────
  const sharedMusic = intersect(userA.musicPreferences, userB.musicPreferences);
  if (sharedMusic.length > 0) {
    const earned = Math.min(WEIGHTS.musicPreferences, sharedMusic.length * 5);
    points += earned;
    reasons.push(`Similar music taste: ${sharedMusic.slice(0, 2).join(', ')}`);
  }

  // ── 7. Lifestyle interests (20 pts) ───────────────────────────────────────
  const sharedInterests = intersect(userA.interests, userB.interests);
  if (sharedInterests.length > 0) {
    const earned = Math.min(WEIGHTS.interests, sharedInterests.length * 5);
    points += earned;
    if (sharedInterests.length === 1) {
      reasons.push(`You both love ${sharedInterests[0]}`);
    } else {
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);
    }
  }

  // ── 8. Shared prompt topics (bonus – capped within interests bucket) ───────
  const promptTopicsA = (userA.prompts || []).map((p) => p.question.toLowerCase());
  const promptTopicsB = (userB.prompts || []).map((p) => p.question.toLowerCase());
  const sharedTopics = promptTopicsA.filter((q) => promptTopicsB.includes(q));
  if (sharedTopics.length > 0 && sharedInterests.length === 0) {
    // Only add if interests didn't already fire
    points += Math.min(5, sharedTopics.length * 3);
    reasons.push(`You answered the same prompt questions`);
  }

  const score = Math.min(100, Math.round(points));

  // Default reason only when we genuinely have no data overlap
  if (reasons.length === 0) {
    reasons.push('New connection – explore compatibility together!');
  }

  return { score, reasons };
};

module.exports = { calculateCompatibility, WEIGHTS };
