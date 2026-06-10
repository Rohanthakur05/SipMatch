import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const BIO_SUGGESTIONS = {
  "Funny": [
    "I'm here to find someone who will look at me the way I look at a free open bar.",
    "My mom says I'm a catch, so you should probably swipe right.",
    "I promise not to steal your fries... unless you're not looking.",
    "Seeking a partner for a zombie apocalypse or Sunday brunch.",
    "I put the 'elusive' in 'exclusive'."
  ],
  "Flirty": [
    "Looking for a reason to delete this app.",
    "I'll buy the first round if you promise to make me laugh.",
    "Do you believe in love at first swipe?",
    "Let's skip the small talk and plan our first date.",
    "Warning: May cause spontaneous road trips and endless laughter."
  ],
  "Sophisticated": [
    "Seeking stimulating conversation and a perfectly aged Bordeaux.",
    "Passionate about art, culture, and discovering hidden gems.",
    "Let's explore the city's finest restaurants and art galleries.",
    "Appreciator of classic literature and smooth jazz evenings.",
    "Looking for a cultured connection built on mutual respect."
  ],
  "Whiskey Lover": [
    "Neat, on the rocks, or in a classic Old Fashioned. Let's share a dram.",
    "Looking for someone to explore whiskey trails and hidden speakeasies.",
    "My ideal date involves a flight of single malts and great conversation.",
    "Peaty, smoky, or sweet - let's find our perfect blend.",
    "Will trade witty banter for a glass of good bourbon."
  ],
  "Cocktail Lover": [
    "Always down to try the bartender's signature creation.",
    "Let's find the best craft cocktails in the city.",
    "Seeking a partner in crime for mixology classes and rooftop bars.",
    "I make a mean Margarita, but I'm looking for someone sweeter.",
    "Shaken or stirred, as long as I'm with you."
  ],
  "Craft Beer Lover": [
    "Brewery hopping is my favorite weekend sport.",
    "Looking for someone to debate IPAs versus Stouts with.",
    "Will travel for limited release craft beers.",
    "Let's find the best local taprooms and food trucks.",
    "I like my beer hazy and my dates clear."
  ],
  "Party Enthusiast": [
    "Last one to leave the dance floor.",
    "Always ready for the next festival or club night.",
    "Let's make memories we might not remember tomorrow.",
    "Seeking a plus one for VIP sections and backstage passes.",
    "Life's a party, and I'm looking for my dance partner."
  ]
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeBioCategory, setActiveBioCategory] = useState("Funny");

  const [formData, setFormData] = useState({
    firstName: '',
    age: '',
    gender: '',
    location: '',
    photos: Array(6).fill(null),
    drinkPreferences: [],
    favoriteDrink: '',
    drinkingHabits: '',
    lifestyle: [],
    music: [],
    bio: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    // Simulate API save
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/discover');
    }, 1500);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.age) newErrors.age = "Age is required";
      if (formData.age && (formData.age < 18 || formData.age > 100)) newErrors.age = "Valid age is required (18+)";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.location.trim()) newErrors.location = "Location is required";
    }
    if (step === 2) {
      const photoCount = formData.photos.filter(p => p !== null).length;
      if (photoCount < 4) newErrors.photos = "Please upload at least 4 photos";
    }
    if (step === 3) {
      if (formData.drinkPreferences.length === 0) newErrors.drinkPreferences = "Select at least one drink";
      if (!formData.favoriteDrink) newErrors.favoriteDrink = "Select your favorite drink";
    }
    if (step === 4) {
      if (!formData.drinkingHabits) newErrors.drinkingHabits = "Please select your habit";
    }
    if (step === 5) {
      if (formData.lifestyle.length < 3) newErrors.lifestyle = "Select at least 3 interests";
    }
    if (step === 6) {
      if (formData.music.length === 0) newErrors.music = "Select at least one genre";
    }
    if (step === 7) {
      if (!formData.bio.trim()) newErrors.bio = "A short bio is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleMultiSelect = (field, option) => {
    const currentList = formData[field];
    const isSelected = currentList.includes(option);
    const newList = isSelected 
      ? currentList.filter(item => item !== option)
      : [...currentList, option];
    
    updateFormData(field, newList);
  };

  // Mock photo upload
  const handlePhotoUpload = (index) => {
    const randomId = Math.floor(Math.random() * 1000);
    const fakeUrl = `https://picsum.photos/seed/${randomId}/300/400`;
    
    const newPhotos = [...formData.photos];
    newPhotos[index] = fakeUrl;
    updateFormData('photos', newPhotos);
  };

  const removePhoto = (index, e) => {
    e.stopPropagation();
    const newPhotos = [...formData.photos];
    newPhotos[index] = null;
    updateFormData('photos', newPhotos);
  };

  const DRINK_OPTIONS = ["Beer", "Whiskey", "Vodka", "Rum", "Gin", "Wine", "Cocktails", "Tequila"];
  const HABIT_OPTIONS = ["Rarely", "Socially", "Weekends", "Frequently"];
  const LIFESTYLE_OPTIONS = ["Live Music", "Clubs", "Pubs", "Travel", "Fitness", "Movies", "Gaming", "Foodie", "Sports", "Coffee", "Festivals", "Networking"];
  const MUSIC_OPTIONS = ["Pop", "Rock", "EDM", "Hip-Hop", "Punjabi", "Bollywood", "Jazz", "Classical"];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">Basic Info</h2>
            <p className="step-subtitle">Let's get to know the real you.</p>
            
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="E.g. Alex"
                value={formData.firstName}
                onChange={e => updateFormData('firstName', e.target.value)}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="25"
                min="18" max="100"
                value={formData.age}
                onChange={e => updateFormData('age', e.target.value)}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                className="form-select"
                value={formData.gender}
                onChange={e => updateFormData('gender', e.target.value)}
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="City, Neighborhood"
                value={formData.location}
                onChange={e => updateFormData('location', e.target.value)}
              />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>
          </div>
        );
      
      case 2: {
        const photoCount = formData.photos.filter(p => p !== null).length;
        const progressPercent = (photoCount / 6) * 100;
        const progressColor = photoCount >= 4 ? 'var(--success)' : 'var(--accent)';

        return (
          <div className="step-content">
            <h2 className="step-title">Add Photos</h2>
            <p className="step-subtitle">Upload up to 6 photos. First photo is your main one. (Min 4 required)</p>
            
            <div className="photo-upload-progress">
              <div className="photo-progress-bar">
                <div 
                  className="photo-progress-fill" 
                  style={{ width: `${progressPercent}%`, backgroundColor: progressColor }}
                ></div>
              </div>
              <div className="photo-count-text">
                <span>{photoCount} / 6 Uploaded</span>
                {photoCount >= 4 ? (
                  <span className="success">✅ Minimum met</span>
                ) : (
                  <span className="warning">({4 - photoCount} more needed)</span>
                )}
              </div>
            </div>

            {errors.photos && <div className="error-message" style={{marginBottom: '1.5rem'}}>{errors.photos}</div>}
            
            <div className="photo-grid">
              {formData.photos.map((photo, index) => (
                <div 
                  key={index} 
                  className={`photo-slot ${photo ? 'has-photo' : ''}`}
                  onClick={() => !photo && handlePhotoUpload(index)}
                >
                  {photo ? (
                    <>
                      <img src={photo} alt={`Upload ${index+1}`} className="photo-img" />
                      <button className="remove-photo" onClick={(e) => removePhoto(index, e)}>×</button>
                    </>
                  ) : (
                    <div className="add-photo-icon">+</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 3:
        return (
          <div className="step-content">
            <h2 className="step-title">Drink Preferences</h2>
            <p className="step-subtitle">What's in your glass? Select all that apply.</p>
            
            {errors.drinkPreferences && <div className="error-message" style={{marginBottom: '1rem'}}>{errors.drinkPreferences}</div>}
            
            <div className="options-grid">
              {DRINK_OPTIONS.map(drink => (
                <div 
                  key={drink}
                  className={`option-pill ${formData.drinkPreferences.includes(drink) ? 'selected' : ''}`}
                  onClick={() => toggleMultiSelect('drinkPreferences', drink)}
                >
                  {drink}
                </div>
              ))}
            </div>

            <div className="form-group" style={{marginTop: '2rem'}}>
              <label className="form-label">What's your absolute favorite?</label>
              <select 
                className="form-select"
                value={formData.favoriteDrink}
                onChange={e => updateFormData('favoriteDrink', e.target.value)}
              >
                <option value="" disabled>Select your favorite drink</option>
                {formData.drinkPreferences.map(drink => (
                  <option key={drink} value={drink}>{drink}</option>
                ))}
              </select>
              {errors.favoriteDrink && <span className="error-message">{errors.favoriteDrink}</span>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2 className="step-title">Drinking Habits</h2>
            <p className="step-subtitle">How often do you enjoy a drink?</p>
            
            {errors.drinkingHabits && <div className="error-message" style={{marginBottom: '1rem'}}>{errors.drinkingHabits}</div>}
            
            <div className="options-grid">
              {HABIT_OPTIONS.map(habit => (
                <div 
                  key={habit}
                  className={`option-pill ${formData.drinkingHabits === habit ? 'selected' : ''}`}
                  onClick={() => updateFormData('drinkingHabits', habit)}
                >
                  {habit}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2 className="step-title">Lifestyle & Interests</h2>
            <p className="step-subtitle">Select at least 3 things you love to do.</p>
            
            {errors.lifestyle && <div className="error-message" style={{marginBottom: '1rem'}}>{errors.lifestyle}</div>}
            
            <div className="options-grid">
              {LIFESTYLE_OPTIONS.map(interest => (
                <div 
                  key={interest}
                  className={`option-pill ${formData.lifestyle.includes(interest) ? 'selected' : ''}`}
                  onClick={() => toggleMultiSelect('lifestyle', interest)}
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <h2 className="step-title">Music Vibes</h2>
            <p className="step-subtitle">What gets you on the dance floor?</p>
            
            {errors.music && <div className="error-message" style={{marginBottom: '1rem'}}>{errors.music}</div>}
            
            <div className="options-grid">
              {MUSIC_OPTIONS.map(genre => (
                <div 
                  key={genre}
                  className={`option-pill ${formData.music.includes(genre) ? 'selected' : ''}`}
                  onClick={() => toggleMultiSelect('music', genre)}
                >
                  {genre}
                </div>
              ))}
            </div>
          </div>
        );

      case 7: {
        const previewPhoto = formData.photos.find(p => p !== null) || 'https://via.placeholder.com/300x400?text=No+Photo';
        
        return (
          <div className="step-content bio-step-content">
            <div className="bio-editor-section">
              <h2 className="step-title">Your Bio</h2>
              <p className="step-subtitle">Write a short bio to stand out. (Max 300 chars)</p>
              
              <div className="form-group">
                <textarea 
                  className="form-textarea"
                  placeholder="I make the best margaritas in town..."
                  value={formData.bio}
                  onChange={e => {
                    if (e.target.value.length <= 300) {
                      updateFormData('bio', e.target.value);
                    }
                  }}
                />
                <div className={`char-counter ${formData.bio.length >= 300 ? 'limit-reached' : ''}`}>
                  {formData.bio.length} / 300
                </div>
                {errors.bio && <span className="error-message">{errors.bio}</span>}
              </div>

              <div className="bio-inspiration">
                <h3>💡 Need Inspiration?</h3>
                <div className="bio-categories">
                  {Object.keys(BIO_SUGGESTIONS).map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      className={`bio-cat-btn ${activeBioCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveBioCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="bio-suggestions-list">
                  {BIO_SUGGESTIONS[activeBioCategory].map((suggestion, idx) => (
                    <div 
                      key={idx} 
                      className="bio-suggestion-item"
                      onClick={() => updateFormData('bio', suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bio-preview-section">
              <h3>Live Preview</h3>
              <div className="profile-preview-card">
                <div 
                  className="preview-photo" 
                  style={{backgroundImage: `url(${previewPhoto})`}}
                >
                  <div className="preview-overlay">
                    <h2>{formData.firstName || 'Name'}, {formData.age || 'Age'}</h2>
                    <p className="preview-location">📍 {formData.location || 'Location'}</p>
                  </div>
                </div>
                <div className="preview-bio">
                  <p>{formData.bio || 'Your bio will appear here...'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 8:
        return (
          <div className="step-content">
            <h2 className="step-title">Review Profile</h2>
            <p className="step-subtitle">Looks good! Ready to find your match?</p>
            
            <div className="review-section">
              <div className="review-block">
                <h3>{formData.firstName}, {formData.age}</h3>
                <div className="review-item">
                  <span className="review-label">Location:</span>
                  <span className="review-value">{formData.location}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Bio:</span>
                  <span className="review-value" style={{textAlign: 'right', flex: 1, marginLeft: '1rem', fontStyle: 'italic'}}>{formData.bio}</span>
                </div>
              </div>

              <div className="review-block">
                <h3>Drinking Profile</h3>
                <div className="review-item">
                  <span className="review-label">Favorite:</span>
                  <span className="review-value">{formData.favoriteDrink}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Habits:</span>
                  <span className="review-value">{formData.drinkingHabits}</span>
                </div>
              </div>

              <div className="review-block">
                <h3>Interests</h3>
                <div className="review-tags">
                  {formData.lifestyle.slice(0, 4).map(item => <span key={item} className="review-tag">{item}</span>)}
                  {formData.lifestyle.length > 4 && <span className="review-tag">+{formData.lifestyle.length - 4} more</span>}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="step-indicator">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </div>

      <div className="onboarding-card">
        {renderStepContent()}

        <div className="nav-buttons">
          {step > 1 ? (
            <button className="btn-nav btn-back" onClick={handleBack} disabled={isSubmitting}>
              Back
            </button>
          ) : (
            <div></div> // Empty div for flex spacing
          )}
          
          {step < totalSteps ? (
            <button className="btn-nav btn-next" onClick={handleNext}>
              Next Step
            </button>
          ) : (
            <button className="btn-nav btn-next" onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? "Creating Profile..." : "Finish Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
