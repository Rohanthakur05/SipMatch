import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateBadge } from '../../utils/badgeEngine';
import './Onboarding.css';

const API_BASE = 'http://localhost:5000/api';

// ── Prompt library ──────────────────────────────────────────────────────────
const PROMPT_LIBRARY = [
  'My perfect drink is...',
  "You'll know we're compatible if...",
  'The best night out includes...',
  'My controversial drink opinion...',
  'My ideal drinking buddy...',
  'The fastest way to my heart...',
  'Two truths and a drink...',
  'My favorite drinking memory...',
  'The song that\'s always on my playlist...',
  'The place I\'d take a first date...',
];

// ── Signature Sip presets ───────────────────────────────────────────────────
const SIP_PRESETS = [
  'Vodka + Sprite', 'Whiskey + Soda', 'Rum + Coke', 'Gin & Tonic',
  'Mojito', 'Old Fashioned', 'Margarita', 'Cosmopolitan',
  'Moscow Mule', 'Aperol Spritz',
];

// ── First-round presets ─────────────────────────────────────────────────────
const FIRST_ROUND_PRESETS = [
  'Whiskey Sour', 'Long Island Iced Tea', 'Beer Pitcher', 'Gin & Tonic',
  'Margarita', 'Moscow Mule', 'Mojito', 'Negroni', 'Espresso Martini',
];

const DRINK_OPTIONS    = ['Beer', 'Whiskey', 'Vodka', 'Rum', 'Gin', 'Wine', 'Cocktails', 'Tequila'];
const HABIT_OPTIONS    = ['Rarely', 'Socially', 'Weekends', 'Frequently'];
const LIFESTYLE_OPTIONS = ['Live Music', 'Clubs', 'Pubs', 'Travel', 'Fitness', 'Movies',
  'Gaming', 'Foodie', 'Sports', 'Coffee', 'Festivals', 'Networking'];
const MUSIC_OPTIONS    = ['Pop', 'Rock', 'EDM', 'Hip-Hop', 'Punjabi', 'Bollywood', 'Jazz', 'Classical'];

const MOMENT_OPTIONS = [
  { emoji: '🌅', label: 'Sunset Sipper' },
  { emoji: '🌙', label: 'Night Owl' },
  { emoji: '🎉', label: 'Weekend Warrior' },
  { emoji: '🍽️', label: 'Dinner Companion' },
  { emoji: '🎶', label: 'Live Music Lover' },
  { emoji: '🏖️', label: 'Vacation Vibes' },
  { emoji: '🏠', label: 'Home Bar Enthusiast' },
];

const NIGHT_OUT_OPTIONS = [
  { emoji: '🍸', label: 'Cocktail Lounge' },
  { emoji: '🍺', label: 'Craft Beer Taproom' },
  { emoji: '🎶', label: 'Live Music Venue' },
  { emoji: '🎉', label: 'Club & Dance Floor' },
  { emoji: '🌇', label: 'Rooftop Bar' },
  { emoji: '🍷', label: 'Wine Tasting' },
  { emoji: '🥃', label: 'Whiskey Bar' },
  { emoji: '🏠', label: 'House Party' },
];

const SOCIAL_VIBE_OPTIONS = [
  { emoji: '🧊', label: 'Chill & Relaxed' },
  { emoji: '😎', label: 'Easy Going' },
  { emoji: '🎉', label: 'Life of the Party' },
  { emoji: '🗣️', label: 'Conversation Lover' },
  { emoji: '🌟', label: 'Adventure Seeker' },
  { emoji: '💃', label: 'Social Butterfly' },
];

const BIO_SUGGESTIONS = {
  'Funny': [
    "I'm here to find someone who will look at me the way I look at a free open bar.",
    "My mom says I'm a catch, so you should probably swipe right.",
    "I promise not to steal your fries... unless you're not looking.",
  ],
  'Flirty': [
    "Looking for a reason to delete this app.",
    "I'll buy the first round if you promise to make me laugh.",
    "Do you believe in love at first swipe?",
  ],
  'Sophisticated': [
    "Seeking stimulating conversation and a perfectly aged Bordeaux.",
    "Passionate about art, culture, and discovering hidden gems.",
    "Let's explore the city's finest restaurants and art galleries.",
  ],
  'Whiskey Lover': [
    "Neat, on the rocks, or in a classic Old Fashioned. Let's share a dram.",
    "Looking for someone to explore whiskey trails and hidden speakeasies.",
  ],
};

// ────────────────────────────────────────────────────────────────────────────

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 12;
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeBioCategory, setActiveBioCategory] = useState('Funny');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [customSip, setCustomSip] = useState('');
  const [customFirstRound, setCustomFirstRound] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState([]); // [{ question, answer }]
  const [promptDraft, setPromptDraft] = useState({ question: '', answer: '' });
  const [addingPrompt, setAddingPrompt] = useState(false);
  const fileInputRef = useRef(null);
  const activeSlotRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '', age: '', gender: '', location: '',
    photos: Array(6).fill(null),
    drinkPreferences: [], favoriteDrink: '', drinkingHabits: '',
    signatureSip: '', drinkingMoment: '',
    nightOutStyle: [], socialVibe: '', firstRoundOrder: '',
    lifestyle: [], music: [], bio: '',
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const liveProfile = {
    ...formData,
    drinkPreferences: formData.drinkPreferences,
    nightOutStyle: formData.nightOutStyle,
    interests: formData.lifestyle,
    musicPreferences: formData.music,
  };
  const liveBadge = calculateBadge(liveProfile);

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleNext = () => { if (validateStep()) setStep(p => Math.min(p + 1, totalSteps)); };
  const handleBack = () => setStep(p => Math.max(p - 1, 1));

  const handleComplete = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE}/profile/personality`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signatureSip: formData.signatureSip || customSip,
            drinkingMoment: formData.drinkingMoment,
            nightOutStyle: formData.nightOutStyle,
            socialVibe: formData.socialVibe,
            firstRoundOrder: formData.firstRoundOrder || customFirstRound,
            prompts: selectedPrompts,
            drinkPreferences: formData.drinkPreferences,
            favoriteDrink: formData.favoriteDrink,
            drinkingHabits: formData.drinkingHabits,
            interests: formData.lifestyle,
            musicPreferences: formData.music,
            bio: formData.bio,
            age: Number(formData.age),
            gender: formData.gender,
            location: formData.location,
          }),
        });
      } catch (_) { /* continue even if API fails */ }
    }
    setIsSubmitting(false);
    navigate('/discover');
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!formData.firstName.trim()) e.firstName = 'First name is required';
      if (!formData.age) e.age = 'Age is required';
      if (formData.age && (formData.age < 18 || formData.age > 100)) e.age = 'Valid age required (18+)';
      if (!formData.gender) e.gender = 'Gender is required';
      if (!formData.location.trim()) e.location = 'Location is required';
    }
    if (step === 2) {
      if (formData.photos.filter(p => p !== null).length < 4) e.photos = 'Please upload at least 4 photos';
    }
    if (step === 3) {
      if (formData.drinkPreferences.length === 0) e.drinkPreferences = 'Select at least one drink';
      if (!formData.favoriteDrink) e.favoriteDrink = 'Select your favorite drink';
    }
    if (step === 4) {
      if (!formData.signatureSip && !customSip.trim()) e.signatureSip = 'Choose or enter your signature sip';
    }
    if (step === 5) {
      if (!formData.drinkingMoment) e.drinkingMoment = 'Choose your drinking moment';
    }
    if (step === 6) {
      if (formData.nightOutStyle.length === 0) e.nightOutStyle = 'Select at least one venue style';
    }
    if (step === 7) {
      if (!formData.socialVibe) e.socialVibe = 'Choose your social vibe';
    }
    if (step === 8) {
      // First round is optional
    }
    if (step === 9) {
      if (formData.lifestyle.length < 3) e.lifestyle = 'Select at least 3 interests';
    }
    if (step === 10) {
      if (formData.music.length === 0) e.music = 'Select at least one genre';
    }
    if (step === 11) {
      if (selectedPrompts.length < 3) e.prompts = 'Answer at least 3 prompts';
    }
    if (step === 12) {
      if (!formData.bio.trim()) e.bio = 'A short bio is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleMultiSelect = (field, option) => {
    const list = formData[field];
    updateFormData(field, list.includes(option) ? list.filter(i => i !== option) : [...list, option]);
  };

  // ── Photo upload ────────────────────────────────────────────────────────
  const handlePhotoUpload = (index) => { activeSlotRef.current = index; fileInputRef.current?.click(); };
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const index = activeSlotRef.current;
    const token = localStorage.getItem('token');
    if (!token) { setErrors(p => ({ ...p, photos: 'Please log in before uploading photos.' })); return; }
    setUploadingIndex(index);
    const fd = new FormData(); fd.append('photo', file);
    try {
      const res = await fetch(`${API_BASE}/upload/profile-photo`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      const newPhotos = [...formData.photos]; newPhotos[index] = data.photoUrl;
      updateFormData('photos', newPhotos);
    } catch (err) { setErrors(p => ({ ...p, photos: err.message })); }
    finally { setUploadingIndex(null); }
  };
  const removePhoto = async (index, e) => {
    e.stopPropagation();
    const photoUrl = formData.photos[index]; if (!photoUrl) return;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE}/upload/profile-photo`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl }),
        });
      } catch (_) {}
    }
    const newPhotos = [...formData.photos]; newPhotos[index] = null;
    updateFormData('photos', newPhotos);
  };

  // ── Prompt management ───────────────────────────────────────────────────
  const addPrompt = () => {
    if (!promptDraft.question || !promptDraft.answer.trim()) return;
    if (selectedPrompts.find(p => p.question === promptDraft.question)) return;
    setSelectedPrompts(prev => [...prev, { ...promptDraft }]);
    setPromptDraft({ question: '', answer: '' });
    setAddingPrompt(false);
  };
  const removePrompt = (q) => setSelectedPrompts(prev => prev.filter(p => p.question !== q));

  // ── Step renderer ───────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── STEP 1: Basic Info ─────────────────────────────────────────────
      case 1: return (
        <div className="step-content">
          <h2 className="step-title">Basic Info</h2>
          <p className="step-subtitle">Let's get to know the real you.</p>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" className="form-input" placeholder="E.g. Alex"
              value={formData.firstName} onChange={e => updateFormData('firstName', e.target.value)} />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input type="number" className="form-input" placeholder="25" min="18" max="100"
              value={formData.age} onChange={e => updateFormData('age', e.target.value)} />
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-select" value={formData.gender} onChange={e => updateFormData('gender', e.target.value)}>
              <option value="" disabled>Select Gender</option>
              <option>Male</option><option>Female</option><option>Non-binary</option><option>Other</option>
            </select>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input type="text" className="form-input" placeholder="City, Neighborhood"
              value={formData.location} onChange={e => updateFormData('location', e.target.value)} />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>
        </div>
      );

      // ── STEP 2: Photos ─────────────────────────────────────────────────
      case 2: {
        const photoCount = formData.photos.filter(p => p !== null).length;
        return (
          <div className="step-content">
            <h2 className="step-title">Add Photos</h2>
            <p className="step-subtitle">Upload up to 6 photos. First is your main photo. (Min 4)</p>
            <div className="photo-upload-progress">
              <div className="photo-progress-bar">
                <div className="photo-progress-fill" style={{ width: `${(photoCount / 6) * 100}%`, backgroundColor: photoCount >= 4 ? 'var(--success)' : 'var(--accent)' }} />
              </div>
              <div className="photo-count-text">
                <span>{photoCount} / 6 Uploaded</span>
                {photoCount >= 4 ? <span className="success">✅ Minimum met</span> : <span className="warning">({4 - photoCount} more needed)</span>}
              </div>
            </div>
            {errors.photos && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.photos}</div>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileSelected} />
            <div className="photo-grid">
              {formData.photos.map((photo, index) => (
                <div key={index} className={`photo-slot ${photo ? 'has-photo' : ''} ${uploadingIndex === index ? 'uploading' : ''}`}
                  onClick={() => !photo && uploadingIndex === null && handlePhotoUpload(index)}>
                  {uploadingIndex === index ? (
                    <div className="uploading-indicator"><div className="spinner" /><span>Uploading...</span></div>
                  ) : photo ? (
                    <>
                      <img src={photo} alt={`Upload ${index + 1}`} className="photo-img" />
                      <button className="remove-photo" onClick={e => removePhoto(index, e)}>×</button>
                      {index === 0 && <div className="main-photo-badge">Main</div>}
                    </>
                  ) : <div className="add-photo-icon">+</div>}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── STEP 3: Drink Preferences ──────────────────────────────────────
      case 3: return (
        <div className="step-content">
          <h2 className="step-title">Drink Preferences</h2>
          <p className="step-subtitle">What's in your glass? Select all that apply.</p>
          {errors.drinkPreferences && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.drinkPreferences}</div>}
          <div className="options-grid">
            {DRINK_OPTIONS.map(drink => (
              <div key={drink} className={`option-pill ${formData.drinkPreferences.includes(drink) ? 'selected' : ''}`}
                onClick={() => toggleMultiSelect('drinkPreferences', drink)}>{drink}</div>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">What's your absolute favorite?</label>
            <select className="form-select" value={formData.favoriteDrink} onChange={e => updateFormData('favoriteDrink', e.target.value)}>
              <option value="" disabled>Select your favorite</option>
              {formData.drinkPreferences.map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.favoriteDrink && <span className="error-message">{errors.favoriteDrink}</span>}
          </div>
        </div>
      );

      // ── STEP 4: Signature Sip ──────────────────────────────────────────
      case 4: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">🥃</div>
            <h2 className="step-title">Signature Sip</h2>
            <p className="step-subtitle">What's your go-to drink combination or favorite order?</p>
          </div>
          {errors.signatureSip && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.signatureSip}</div>}
          <div className="sip-presets">
            {SIP_PRESETS.map(sip => (
              <div key={sip} className={`sip-chip ${formData.signatureSip === sip ? 'selected' : ''}`}
                onClick={() => { updateFormData('signatureSip', sip); setCustomSip(''); }}>
                {sip}
              </div>
            ))}
          </div>
          <div className="custom-input-row">
            <input type="text" className="form-input" placeholder="Or type your own signature sip..."
              value={customSip}
              onChange={e => { setCustomSip(e.target.value); if (e.target.value) updateFormData('signatureSip', ''); }} />
          </div>
          {(formData.signatureSip || customSip) && (
            <div className="preview-chip">
              <span>Your Signature Sip:</span>
              <strong>{formData.signatureSip || customSip}</strong>
            </div>
          )}
        </div>
      );

      // ── STEP 5: Drinking Moment ────────────────────────────────────────
      case 5: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">✨</div>
            <h2 className="step-title">Your Drinking Moment</h2>
            <p className="step-subtitle">When do you enjoy a drink most?</p>
          </div>
          {errors.drinkingMoment && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.drinkingMoment}</div>}
          <div className="moment-grid">
            {MOMENT_OPTIONS.map(({ emoji, label }) => (
              <div key={label} className={`moment-tile ${formData.drinkingMoment === label ? 'selected' : ''}`}
                onClick={() => updateFormData('drinkingMoment', label)}>
                <span className="moment-emoji">{emoji}</span>
                <span className="moment-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      );

      // ── STEP 6: Night Out Style ────────────────────────────────────────
      case 6: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">🌃</div>
            <h2 className="step-title">Night Out Style</h2>
            <p className="step-subtitle">Your ideal night out? Select all that fit.</p>
          </div>
          {errors.nightOutStyle && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.nightOutStyle}</div>}
          <div className="moment-grid">
            {NIGHT_OUT_OPTIONS.map(({ emoji, label }) => (
              <div key={label} className={`moment-tile ${formData.nightOutStyle.includes(label) ? 'selected' : ''}`}
                onClick={() => toggleMultiSelect('nightOutStyle', label)}>
                <span className="moment-emoji">{emoji}</span>
                <span className="moment-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      );

      // ── STEP 7: Social Vibe ────────────────────────────────────────────
      case 7: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">⚡</div>
            <h2 className="step-title">Social Vibe</h2>
            <p className="step-subtitle">How would your friends describe you?</p>
          </div>
          {errors.socialVibe && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.socialVibe}</div>}
          <div className="vibe-grid">
            {SOCIAL_VIBE_OPTIONS.map(({ emoji, label }) => (
              <div key={label} className={`vibe-card ${formData.socialVibe === label ? 'selected' : ''}`}
                onClick={() => updateFormData('socialVibe', label)}>
                <span className="vibe-emoji">{emoji}</span>
                <span className="vibe-label">{label}</span>
                {formData.socialVibe === label && <span className="vibe-check">✓</span>}
              </div>
            ))}
          </div>
          {formData.signatureSip || customSip || formData.drinkingMoment || formData.socialVibe ? (
            <div className="badge-preview-box">
              <span className="badge-preview-label">Your Badge Preview</span>
              <span className="badge-preview-value">{liveBadge}</span>
            </div>
          ) : null}
        </div>
      );

      // ── STEP 8: First Round ────────────────────────────────────────────
      case 8: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">🥂</div>
            <h2 className="step-title">First Round's On Me</h2>
            <p className="step-subtitle">What's your first order when you go out?</p>
          </div>
          <div className="sip-presets">
            {FIRST_ROUND_PRESETS.map(drink => (
              <div key={drink} className={`sip-chip ${formData.firstRoundOrder === drink ? 'selected' : ''}`}
                onClick={() => { updateFormData('firstRoundOrder', drink); setCustomFirstRound(''); }}>
                {drink}
              </div>
            ))}
          </div>
          <div className="custom-input-row">
            <input type="text" className="form-input" placeholder="Or type your own first order..."
              value={customFirstRound}
              onChange={e => { setCustomFirstRound(e.target.value); if (e.target.value) updateFormData('firstRoundOrder', ''); }} />
          </div>
          <p className="step-optional">Optional — skip if you're still deciding 😄</p>
        </div>
      );

      // ── STEP 9: Lifestyle ──────────────────────────────────────────────
      case 9: return (
        <div className="step-content">
          <h2 className="step-title">Lifestyle & Interests</h2>
          <p className="step-subtitle">Select at least 3 things you love.</p>
          {errors.lifestyle && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.lifestyle}</div>}
          <div className="options-grid">
            {LIFESTYLE_OPTIONS.map(interest => (
              <div key={interest} className={`option-pill ${formData.lifestyle.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleMultiSelect('lifestyle', interest)}>{interest}</div>
            ))}
          </div>
        </div>
      );

      // ── STEP 10: Music ─────────────────────────────────────────────────
      case 10: return (
        <div className="step-content">
          <h2 className="step-title">Music Vibes</h2>
          <p className="step-subtitle">What gets you on the dance floor?</p>
          {errors.music && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.music}</div>}
          <div className="options-grid">
            {MUSIC_OPTIONS.map(genre => (
              <div key={genre} className={`option-pill ${formData.music.includes(genre) ? 'selected' : ''}`}
                onClick={() => toggleMultiSelect('music', genre)}>{genre}</div>
            ))}
          </div>
        </div>
      );

      // ── STEP 11: SipMatch Prompts ──────────────────────────────────────
      case 11: return (
        <div className="step-content">
          <div className="personality-step-header">
            <div className="personality-step-icon">💬</div>
            <h2 className="step-title">SipMatch Prompts</h2>
            <p className="step-subtitle">Answer 3 prompts — these become your conversation starters.</p>
          </div>
          {errors.prompts && <div className="error-message" style={{ marginBottom: '1rem' }}>{errors.prompts}</div>}

          {/* Answered prompts */}
          <div className="prompts-answered">
            {selectedPrompts.map(({ question, answer }) => (
              <div key={question} className="prompt-answer-card">
                <div className="prompt-q">{question}</div>
                <div className="prompt-a">"{answer}"</div>
                <button className="prompt-remove" onClick={() => removePrompt(question)}>×</button>
              </div>
            ))}
          </div>

          {/* Add prompt */}
          {selectedPrompts.length < 5 && !addingPrompt && (
            <button className="add-prompt-btn" onClick={() => setAddingPrompt(true)}>
              + Add a Prompt ({selectedPrompts.length}/5 added, 3 required)
            </button>
          )}

          {addingPrompt && (
            <div className="prompt-editor">
              <label className="form-label">Choose a prompt:</label>
              <select className="form-select" value={promptDraft.question}
                onChange={e => setPromptDraft(p => ({ ...p, question: e.target.value }))}>
                <option value="" disabled>Select a prompt...</option>
                {PROMPT_LIBRARY.filter(q => !selectedPrompts.find(p => p.question === q)).map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {promptDraft.question && (
                <>
                  <label className="form-label" style={{ marginTop: '1rem' }}>Your answer:</label>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Write your answer..."
                    value={promptDraft.answer}
                    onChange={e => setPromptDraft(p => ({ ...p, answer: e.target.value }))} />
                  <div className="prompt-editor-actions">
                    <button className="btn-nav btn-next" style={{ flex: 'none', padding: '0.7rem 1.5rem' }}
                      onClick={addPrompt} disabled={!promptDraft.answer.trim()}>Save</button>
                    <button className="btn-nav btn-back" onClick={() => { setAddingPrompt(false); setPromptDraft({ question: '', answer: '' }); }}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      );

      // ── STEP 12: Bio + Review ──────────────────────────────────────────
      case 12: {
        const previewPhoto = formData.photos.find(p => p !== null) || 'https://via.placeholder.com/300x400?text=No+Photo';
        return (
          <div className="step-content bio-step-content">
            <div className="bio-editor-section">
              <h2 className="step-title">Your Bio</h2>
              <p className="step-subtitle">Write a short bio. (Max 300 chars)</p>
              <div className="form-group">
                <textarea className="form-textarea" placeholder="I make the best margaritas in town..."
                  value={formData.bio}
                  onChange={e => { if (e.target.value.length <= 300) updateFormData('bio', e.target.value); }} />
                <div className={`char-counter ${formData.bio.length >= 300 ? 'limit-reached' : ''}`}>{formData.bio.length} / 300</div>
                {errors.bio && <span className="error-message">{errors.bio}</span>}
              </div>
              <div className="bio-inspiration">
                <h3>💡 Need Inspiration?</h3>
                <div className="bio-categories">
                  {Object.keys(BIO_SUGGESTIONS).map(cat => (
                    <button key={cat} type="button" className={`bio-cat-btn ${activeBioCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveBioCategory(cat)}>{cat}</button>
                  ))}
                </div>
                <div className="bio-suggestions-list">
                  {BIO_SUGGESTIONS[activeBioCategory].map((s, i) => (
                    <div key={i} className="bio-suggestion-item" onClick={() => updateFormData('bio', s)}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bio-preview-section">
              <h3>Live Preview</h3>
              <div className="profile-preview-card">
                <div className="preview-photo" style={{ backgroundImage: `url(${previewPhoto})` }}>
                  <div className="preview-overlay">
                    <h2>{formData.firstName || 'Name'}, {formData.age || 'Age'}</h2>
                    <p className="preview-location">📍 {formData.location || 'Location'}</p>
                  </div>
                </div>
                <div className="preview-bio">
                  {liveBadge && <div className="preview-badge">{liveBadge}</div>}
                  <p>{formData.bio || 'Your bio will appear here...'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="step-indicator">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressPct)}% Complete</span>
        </div>
      </div>

      <div className="onboarding-card">
        {renderStep()}
        <div className="nav-buttons">
          {step > 1 ? (
            <button className="btn-nav btn-back" onClick={handleBack} disabled={isSubmitting}>Back</button>
          ) : <div />}
          {step < totalSteps ? (
            <button className="btn-nav btn-next" onClick={handleNext}>Next Step</button>
          ) : (
            <button className="btn-nav btn-next" onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Profile...' : '🥂 Start Matching'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
