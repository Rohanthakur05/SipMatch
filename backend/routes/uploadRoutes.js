const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadMiddleware');
const {
  uploadSinglePhoto,
  uploadMultiplePhotos,
  deletePhoto,
  setPrimaryPhoto,
  reorderPhotos,
} = require('../controllers/uploadController');

// Multer error wrapper – surfaces Multer-specific errors as JSON
const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// ── Upload Routes ──────────────────────────────────────────
// POST /api/upload/profile-photo       → single upload
router.post(
  '/profile-photo',
  protect,
  handleMulterError(uploadSingle),
  uploadSinglePhoto
);

// POST /api/upload/profile-photos      → batch upload (up to 6)
router.post(
  '/profile-photos',
  protect,
  handleMulterError(uploadMultiple),
  uploadMultiplePhotos
);

// DELETE /api/upload/profile-photo     → remove by URL (body: { photoUrl })
router.delete('/profile-photo', protect, deletePhoto);

// PUT /api/upload/primary-photo        → set primary (body: { photoUrl })
router.put('/primary-photo', protect, setPrimaryPhoto);

// PUT /api/upload/reorder-photos       → reorder (body: { orderedUrls })
router.put('/reorder-photos', protect, reorderPhotos);

module.exports = router;
