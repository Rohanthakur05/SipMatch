const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { recordSwipe, getDiscoverFeed, getMatches } = require('../controllers/swipeController');

// POST /api/swipes        → record a swipe, auto-create match on mutual like
router.post('/', protect, recordSwipe);

// GET  /api/discover      → paginated discover feed (excludes swiped/matched)
router.get('/discover', protect, getDiscoverFeed);

// GET  /api/matches       → all matches for the logged-in user
router.get('/matches', protect, getMatches);

module.exports = router;
