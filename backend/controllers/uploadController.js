const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Helper – extract Cloudinary public_id from a stored URL
const getPublicId = (url) => {
  // URL pattern: .../sipmatch/profile-photos/<public_id>.<ext>
  const parts = url.split('/');
  const filenameWithExt = parts[parts.length - 1];
  const filename = filenameWithExt.split('.')[0];
  return `sipmatch/profile-photos/${filename}`;
};

// ────────────────────────────────────────────
// @desc  Upload a single profile photo
// @route POST /api/upload/profile-photo
// @access Private
// ────────────────────────────────────────────
const uploadSinglePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.profilePhotos.length >= 6) {
      // Delete the just-uploaded Cloudinary file so we don't orphan it
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: 'Maximum 6 photos allowed.' });
    }

    const photoUrl = req.file.path;
    user.profilePhotos.push(photoUrl);

    // Auto-set primary photo if this is the first upload
    if (!user.primaryPhoto) {
      user.primaryPhoto = photoUrl;
      user.profileImage = photoUrl; // keep legacy field in sync
    }

    await user.save();

    res.status(201).json({
      message: 'Photo uploaded successfully.',
      photoUrl,
      profilePhotos: user.profilePhotos,
      primaryPhoto: user.primaryPhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ────────────────────────────────────────────
// @desc  Upload multiple profile photos (batch)
// @route POST /api/upload/profile-photos
// @access Private
// ────────────────────────────────────────────
const uploadMultiplePhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const slotsAvailable = 6 - user.profilePhotos.length;
    if (slotsAvailable <= 0) {
      // Clean up orphaned uploads
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      return res.status(400).json({ message: 'Maximum 6 photos allowed.' });
    }

    // Accept only as many as we have slots for
    const filesToKeep = req.files.slice(0, slotsAvailable);
    const filesToDiscard = req.files.slice(slotsAvailable);

    for (const file of filesToDiscard) {
      await cloudinary.uploader.destroy(file.filename);
    }

    const newUrls = filesToKeep.map((f) => f.path);
    user.profilePhotos.push(...newUrls);

    if (!user.primaryPhoto && user.profilePhotos.length > 0) {
      user.primaryPhoto = user.profilePhotos[0];
      user.profileImage = user.profilePhotos[0];
    }

    await user.save();

    res.status(201).json({
      message: `${newUrls.length} photo(s) uploaded successfully.`,
      uploadedUrls: newUrls,
      profilePhotos: user.profilePhotos,
      primaryPhoto: user.primaryPhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ────────────────────────────────────────────
// @desc  Delete a profile photo by URL
// @route DELETE /api/upload/profile-photo
// @access Private
// Body: { photoUrl: "https://res.cloudinary.com/..." }
// ────────────────────────────────────────────
const deletePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: 'photoUrl is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.profilePhotos.includes(photoUrl)) {
      return res.status(404).json({ message: 'Photo not found in your profile.' });
    }

    // Enforce minimum 4 photos (only after onboarding)
    // Comment this block out during initial onboarding if needed
    // if (user.profilePhotos.length <= 4) {
    //   return res.status(400).json({ message: 'Minimum 4 photos required.' });
    // }

    // Delete from Cloudinary
    const publicId = getPublicId(photoUrl);
    await cloudinary.uploader.destroy(publicId);

    // Remove from DB
    user.profilePhotos = user.profilePhotos.filter((p) => p !== photoUrl);

    // If deleted photo was primary, promote next or clear
    if (user.primaryPhoto === photoUrl) {
      user.primaryPhoto = user.profilePhotos[0] || '';
      user.profileImage = user.primaryPhoto;
    }

    await user.save();

    res.json({
      message: 'Photo deleted successfully.',
      profilePhotos: user.profilePhotos,
      primaryPhoto: user.primaryPhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ────────────────────────────────────────────
// @desc  Set primary photo
// @route PUT /api/upload/primary-photo
// @access Private
// Body: { photoUrl: "https://res.cloudinary.com/..." }
// ────────────────────────────────────────────
const setPrimaryPhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: 'photoUrl is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.profilePhotos.includes(photoUrl)) {
      return res.status(404).json({ message: 'Photo not found in your profile.' });
    }

    user.primaryPhoto = photoUrl;
    user.profileImage = photoUrl;
    await user.save();

    res.json({
      message: 'Primary photo updated.',
      primaryPhoto: user.primaryPhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ────────────────────────────────────────────
// @desc  Reorder profile photos
// @route PUT /api/upload/reorder-photos
// @access Private
// Body: { orderedUrls: ["url1", "url2", ...] }
// ────────────────────────────────────────────
const reorderPhotos = async (req, res) => {
  try {
    const { orderedUrls } = req.body;
    if (!orderedUrls || !Array.isArray(orderedUrls)) {
      return res.status(400).json({ message: 'orderedUrls array is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Validate all URLs belong to the user
    const invalid = orderedUrls.filter((u) => !user.profilePhotos.includes(u));
    if (invalid.length > 0) {
      return res.status(400).json({ message: 'One or more URLs are invalid.' });
    }

    user.profilePhotos = orderedUrls;
    user.primaryPhoto = orderedUrls[0];
    user.profileImage = orderedUrls[0];
    await user.save();

    res.json({
      message: 'Photos reordered successfully.',
      profilePhotos: user.profilePhotos,
      primaryPhoto: user.primaryPhoto,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadSinglePhoto,
  uploadMultiplePhotos,
  deletePhoto,
  setPrimaryPhoto,
  reorderPhotos,
};
