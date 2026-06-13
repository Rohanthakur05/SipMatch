const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: false,
    },
    bio: {
      type: String,
      default: '',
    },
    // Legacy single image (kept for backwards compat)
    profileImage: {
      type: String,
      default: '',
    },
    // Cloudinary photo array (min 4, max 6)
    profilePhotos: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 6;
        },
        message: 'Maximum 6 photos allowed.',
      },
    },
    primaryPhoto: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
