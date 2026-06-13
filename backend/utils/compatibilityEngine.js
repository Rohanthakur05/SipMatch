/**
 * compatibilityEngine.js
 * Calculates a compatibility score (0–100) and human-readable reasons
 * between two user documents.
 */

const intersect = (a = [], b = []) =>
  a.filter((x) => b.map((y) => y.toLowerCase()).includes(x.toLowerCase()));

/**
 * @param {Object} userA  – Mongoose user doc (current user)
 * @param {Object} userB  – Mongoose user doc (target user)
 * @returns {{ score: number, reasons: string[] }}
 */
const calculateCompatibility = (userA, userB) => {
  let points = 0;
  const MAX = 100;
  const reasons = [];

  // ── 1. Shared favorite drinks (weight: 30 pts) ──────────────────
  const sharedDrinks = intersect(
    userA.drinkPreferences,
    userB.drinkPreferences
  );
  if (sharedDrinks.length > 0) {
    const drinkScore = Math.min(30, sharedDrinks.length * 10);
    points += drinkScore;

    if (sharedDrinks.length === 1) {
      reasons.push(`Both enjoy ${sharedDrinks[0]}`);
    } else {
      reasons.push(`Both enjoy ${sharedDrinks.slice(0, 2).join(' & ')}`);
    }
  }

  // Bonus: same absolute favorite drink (10 pts)
  if (
    userA.favoriteDrink &&
    userB.favoriteDrink &&
    userA.favoriteDrink.toLowerCase() === userB.favoriteDrink.toLowerCase()
  ) {
    points += 10;
    reasons.push(`${userA.favoriteDrink} is a favourite for both`);
  }

  // ── 2. Shared interests (weight: 30 pts) ────────────────────────
  const sharedInterests = intersect(userA.interests, userB.interests);
  if (sharedInterests.length > 0) {
    const interestScore = Math.min(30, sharedInterests.length * 8);
    points += interestScore;

    if (sharedInterests.length === 1) {
      reasons.push(`Both love ${sharedInterests[0]}`);
    } else {
      reasons.push(
        `Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`
      );
    }
  }

  // ── 3. Shared music preferences (weight: 20 pts) ─────────────────
  const sharedMusic = intersect(
    userA.musicPreferences,
    userB.musicPreferences
  );
  if (sharedMusic.length > 0) {
    const musicScore = Math.min(20, sharedMusic.length * 7);
    points += musicScore;
    reasons.push(`Similar music taste: ${sharedMusic.slice(0, 2).join(', ')}`);
  }

  // ── 4. Similar drinking habits (weight: 10 pts) ──────────────────
  if (
    userA.drinkingHabits &&
    userB.drinkingHabits &&
    userA.drinkingHabits === userB.drinkingHabits
  ) {
    points += 10;
    reasons.push(`Same drinking frequency (${userA.drinkingHabits})`);
  }

  // Clamp to 0–100
  const score = Math.min(MAX, Math.round(points));

  // Fallback reason when there's nothing in common
  if (reasons.length === 0) {
    reasons.push('New connection – explore compatibility together!');
  }

  return { score, reasons };
};

module.exports = { calculateCompatibility };
