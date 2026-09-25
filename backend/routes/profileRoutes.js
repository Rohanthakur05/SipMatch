const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  updatePersonality,
  getMyProfile,
  getProfileStats,
  updateSettings,
} = require('../controllers/profileController');

// GET  /api/profile/me           → full profile of logged-in user (no password)
router.get('/me', protect, getMyProfile);

// GET  /api/profile/stats        → real like/match counts
router.get('/stats', protect, getProfileStats);

// PUT  /api/profile/personality  → save personality fields + recalculate badge
router.put('/personality', protect, updatePersonality);

// PUT  /api/profile/settings     → save discoveryPreferences, notifications, privacy
router.put('/settings', protect, updateSettings);

module.exports = router;
