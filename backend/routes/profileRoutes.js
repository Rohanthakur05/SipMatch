const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updatePersonality, getMyProfile } = require('../controllers/profileController');

// GET  /api/profile/me           → full profile of logged-in user
router.get('/me', protect, getMyProfile);

// PUT  /api/profile/personality  → save personality + recalculate badge
router.put('/personality', protect, updatePersonality);

module.exports = router;
