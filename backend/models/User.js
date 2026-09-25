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
    // Onboarding / preference fields
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    drinkPreferences: {
      type: [String],
      default: [],
    },
    favoriteDrink: {
      type: String,
      default: '',
    },
    drinkingHabits: {
      type: String,
      default: '',
    },
    interests: {
      type: [String],
      default: [],
    },
    musicPreferences: {
      type: [String],
      default: [],
    },
    // ── SipMatch Personality Layer ──────────────────────────────────
    signatureSip: {
      type: String,
      default: '',
    },
    drinkingMoment: {
      type: String,
      default: '',
    },
    nightOutStyle: {
      type: [String],
      default: [],
    },
    socialVibe: {
      type: String,
      default: '',
    },
    firstRoundOrder: {
      type: String,
      default: '',
    },
    prompts: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
      validate: {
        validator: (v) => v.length <= 5,
        message: 'Maximum 5 prompts allowed.',
      },
    },
    personalityBadge: {
      type: String,
      default: '',
    },
    // ── Discovery Preferences (saved from Settings page) ────────────────
    discoveryPreferences: {
      ageMin:      { type: Number, default: 21 },
      ageMax:      { type: Number, default: 35 },
      lookingFor:  { type: String, default: 'Dating' },
    },
    // ── Notification preferences ─────────────────────────────────────────
    notifications: {
      newMatch:     { type: Boolean, default: true },
      newMessage:   { type: Boolean, default: true },
      profileLike:  { type: Boolean, default: false },
      appUpdates:   { type: Boolean, default: true },
      promotional:  { type: Boolean, default: false },
    },
    // ── Privacy preferences ───────────────────────────────────────────────
    privacy: {
      showDistance:     { type: Boolean, default: true },
      showAge:          { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      profileVisibility:{ type: Boolean, default: true },
      readReceipts:     { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;

