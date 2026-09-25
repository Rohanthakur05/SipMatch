const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMessages, sendMessage } = require('../controllers/messageController');

// GET  /api/messages/:matchId  → paginated conversation (participants only)
router.get('/:matchId', protect, getMessages);

// POST /api/messages/:matchId  → HTTP fallback send (Socket.io is primary)
router.post('/:matchId', protect, sendMessage);

module.exports = router;
