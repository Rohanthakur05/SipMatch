const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  recordSwipe,
  getDiscoverFeed,
  getMatches,
  getMatchById,
} = require('../controllers/swipeController');

// POST /api/swipes          → record a swipe, auto-create match on mutual like
router.post('/swipes', protect, recordSwipe);

// GET  /api/discover        → paginated & completeness-gated discover feed
router.get('/discover', protect, getDiscoverFeed);

// GET  /api/matches         → all matches for the logged-in user
router.get('/matches', protect, getMatches);

// GET  /api/matches/:matchId → single match (participants only)
router.get('/matches/:matchId', protect, getMatchById);

module.exports = router;
