/**
 * compatibilityEngine.js — V2
 * 7-factor scoring system (100 pts max).
 * Weights personality-driven factors (vibe, venue, moment) as
 * heavily as drink preferences to make matches feel lifestyle-first.
 */

const intersect = (a = [], b = []) =>
  a.filter((x) =>
    b.map((y) => (y || '').toLowerCase()).includes((x || '').toLowerCase())
  );

const sameString = (a, b) =>
  a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * @param {Object} userA  – current user doc
 * @param {Object} userB  – target user doc
 * @returns {{ score: number, reasons: string[] }}
 */
const calculateCompatibility = (userA, userB) => {
  let points = 0;
  const reasons = [];

  // ── 1. Shared drink preferences (20 pts) ────────────────────────
  const sharedDrinks = intersect(userA.drinkPreferences, userB.drinkPreferences);
  if (sharedDrinks.length > 0) {
    points += Math.min(20, sharedDrinks.length * 7);
    if (sharedDrinks.length === 1) {
      reasons.push(`Both enjoy ${sharedDrinks[0]}`);
    } else {
      reasons.push(`Both enjoy ${sharedDrinks.slice(0, 2).join(' & ')}`);
    }
  }

  // ── 2. Matching signature sip (10 pts) ──────────────────────────
  if (sameString(userA.signatureSip, userB.signatureSip)) {
    points += 10;
    reasons.push(`Same signature sip: ${userA.signatureSip}`);
  } else if (userA.favoriteDrink && sameString(userA.favoriteDrink, userB.favoriteDrink)) {
    // Legacy fallback
    points += 6;
    reasons.push(`${userA.favoriteDrink} is a favourite for both`);
  }

  // ── 3. Shared night out style (20 pts) ──────────────────────────
  const sharedVenues = intersect(userA.nightOutStyle, userB.nightOutStyle);
  if (sharedVenues.length > 0) {
    points += Math.min(20, sharedVenues.length * 7);
    if (sharedVenues.length === 1) {
      reasons.push(`Both love ${sharedVenues[0]}`);
    } else {
      reasons.push(`Both love ${sharedVenues.slice(0, 2).join(' & ')}`);
    }
  }

  // ── 4. Same social vibe (15 pts) ────────────────────────────────
  if (sameString(userA.socialVibe, userB.socialVibe)) {
    points += 15;
    const label = (userA.socialVibe || '').replace(/^[^\w]+/, '').trim();
    reasons.push(`Similar social vibe – both are ${label}`);
  }

  // ── 5. Same drinking moment (10 pts) ────────────────────────────
  if (sameString(userA.drinkingMoment, userB.drinkingMoment)) {
    points += 10;
    const label = (userA.drinkingMoment || '').replace(/^[^\w]+/, '').trim();
    reasons.push(`Both are ${label}`);
  } else if (sameString(userA.drinkingHabits, userB.drinkingHabits)) {
    // Legacy fallback
    points += 5;
    reasons.push(`Same drinking frequency (${userA.drinkingHabits})`);
  }

  // ── 6. Shared music preferences (15 pts) ────────────────────────
  const sharedMusic = intersect(userA.musicPreferences, userB.musicPreferences);
  if (sharedMusic.length > 0) {
    points += Math.min(15, sharedMusic.length * 5);
    reasons.push(`Similar music taste: ${sharedMusic.slice(0, 2).join(', ')}`);
  }

  // ── 7. Shared lifestyle interests (10 pts) ──────────────────────
  const sharedInterests = intersect(userA.interests, userB.interests);
  if (sharedInterests.length > 0) {
    points += Math.min(10, sharedInterests.length * 4);
    if (sharedInterests.length === 1) {
      reasons.push(`Both love ${sharedInterests[0]}`);
    } else {
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);
    }
  }

  const score = Math.min(100, Math.round(points));

  if (reasons.length === 0) {
    reasons.push('New connection – explore compatibility together!');
  }

  return { score, reasons };
};

module.exports = { calculateCompatibility };
