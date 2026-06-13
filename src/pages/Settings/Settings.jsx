import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiChevronLeft, FiChevronRight, FiStar, FiCheck,
  FiBell, FiLock, FiLogOut, FiHelpCircle, FiShield
} from 'react-icons/fi';
import './Settings.css';

// Mock Data & Options
const drinkOptions = ['Whiskey', 'Beer', 'Wine', 'Vodka', 'Rum', 'Gin', 'Cocktails', 'Tequila'];
const lifestyleOptions = ['Live Music', 'Clubs', 'Pubs', 'Travel', 'Fitness', 'Movies', 'Gaming', 'Foodie', 'Sports', 'Coffee'];
const lookingForOptions = ['Dating', 'Friendship', 'Drinking Buddy', 'Networking', 'Casual Meetups'];

export default function Settings() {
  const navigate = useNavigate();

  // Mock State
  const [preferences, setPreferences] = useState({
    minAge: 21,
    maxAge: 35,
    distance: 25,
    lookingFor: 'Dating',
    preferredDrinks: ['Whiskey', 'Cocktails', 'Wine'],
    excludedDrinks: ['Tequila'],
    lifestyle: ['Live Music', 'Coffee', 'Travel'],
    notifications: {
      newMatch: true,
      newMessage: true,
      profileLike: false,
      appUpdates: true,
      promotional: false
    },
    privacy: {
      showDistance: true,
      showAge: true,
      showOnlineStatus: true,
      profileVisibility: true,
      readReceipts: true
    }
  });

  const toggleNotification = (key) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const togglePrivacy = (key) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
  };

  const toggleDrink = (drink) => {
    setPreferences(prev => {
      const isPreferred = prev.preferredDrinks.includes(drink);
      const isExcluded = prev.excludedDrinks.includes(drink);
      
      let newPreferred = [...prev.preferredDrinks];
      let newExcluded = [...prev.excludedDrinks];

      if (isPreferred) {
        newPreferred = newPreferred.filter(d => d !== drink);
        newExcluded.push(drink);
      } else if (isExcluded) {
        newExcluded = newExcluded.filter(d => d !== drink);
      } else {
        newPreferred.push(drink);
      }

      return { ...prev, preferredDrinks: newPreferred, excludedDrinks: newExcluded };
    });
  };

  const toggleLifestyle = (tag) => {
    setPreferences(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(tag) 
        ? prev.lifestyle.filter(t => t !== tag)
        : [...prev.lifestyle, tag]
    }));
  };

  return (
    <div className="settings-container animate-fadeIn">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <FiChevronLeft />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        
        {/* Premium Placeholder */}
        <div className="premium-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <FiStar className="premium-icon" />
          <h2 className="premium-title">SipMatch Premium</h2>
          <div className="premium-features">
            <div className="premium-feature">
              <FiCheck className="premium-feature-icon" />
              <span>Unlimited Likes & Swipes</span>
            </div>
            <div className="premium-feature">
              <FiCheck className="premium-feature-icon" />
              <span>Advanced Drink Filters</span>
            </div>
            <div className="premium-feature">
              <FiCheck className="premium-feature-icon" />
              <span>Priority Profile Visibility</span>
            </div>
            <div className="premium-feature">
              <FiCheck className="premium-feature-icon" />
              <span>See Who Liked You</span>
            </div>
          </div>
          <button className="premium-btn">Upgrade Now</button>
        </div>

        {/* Account Settings */}
        <div className="settings-section" style={{ animationDelay: '0.2s' }}>
          <h3 className="section-title">Account Settings</h3>
          <div className="settings-card">
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Email Address</span>
                <span className="row-subtitle">alex@example.com</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Phone Number</span>
                <span className="row-subtitle">+1 (555) 012-3456</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Change Password</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title" style={{ color: 'var(--error)' }}>Delete Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Preferences */}
        <div className="settings-section" style={{ animationDelay: '0.3s' }}>
          <h3 className="section-title">Discovery Preferences</h3>
          <div className="settings-card">
            
            <div className="slider-container">
              <div className="slider-header">
                <span className="slider-title">Maximum Distance</span>
                <span className="slider-value">{preferences.distance} km</span>
              </div>
              <input 
                type="range" 
                min="5" max="100" 
                value={preferences.distance} 
                onChange={(e) => setPreferences({...preferences, distance: e.target.value})}
                className="range-slider"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="slider-title">Age Range</span>
                <span className="slider-value">{preferences.minAge} - {preferences.maxAge}</span>
              </div>
              <input 
                type="range" 
                min="18" max="99" 
                value={preferences.maxAge} 
                onChange={(e) => setPreferences({...preferences, maxAge: Math.max(e.target.value, preferences.minAge)})}
                className="range-slider"
              />
            </div>

            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Looking For</span>
                <span className="row-subtitle">{preferences.lookingFor}</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
          </div>
        </div>

        {/* Drink Preferences Filter */}
        <div className="settings-section" style={{ animationDelay: '0.4s' }}>
          <h3 className="section-title">Drink Preferences</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '8px', marginTop: '-8px' }}>
            Tap once to prefer, twice to exclude.
          </p>
          <div className="settings-card">
            <div className="chips-container">
              {drinkOptions.map(drink => {
                const isPreferred = preferences.preferredDrinks.includes(drink);
                const isExcluded = preferences.excludedDrinks.includes(drink);
                return (
                  <div 
                    key={drink}
                    className={`chip ${isPreferred ? 'selected' : ''} ${isExcluded ? 'excluded' : ''}`}
                    onClick={() => toggleDrink(drink)}
                  >
                    {isPreferred && '✓ '}{isExcluded && '✕ '}{drink}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lifestyle Filters */}
        <div className="settings-section" style={{ animationDelay: '0.5s' }}>
          <h3 className="section-title">Lifestyle & Interests</h3>
          <div className="settings-card">
            <div className="chips-container">
              {lifestyleOptions.map(tag => (
                <div 
                  key={tag}
                  className={`chip ${preferences.lifestyle.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleLifestyle(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section" style={{ animationDelay: '0.6s' }}>
          <h3 className="section-title">Notifications</h3>
          <div className="settings-card">
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">New Matches</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.newMatch}
                  onChange={() => toggleNotification('newMatch')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Messages</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.newMessage}
                  onChange={() => toggleNotification('newMessage')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Profile Likes</span>
                <span className="row-subtitle">Requires Premium</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" disabled checked={false} />
                <span className="toggle-slider" style={{ opacity: 0.5 }}></span>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section" style={{ animationDelay: '0.7s' }}>
          <h3 className="section-title">Privacy</h3>
          <div className="settings-card">
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Show Distance</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.privacy.showDistance}
                  onChange={() => togglePrivacy('showDistance')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Show Online Status</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.privacy.showOnlineStatus}
                  onChange={() => togglePrivacy('showOnlineStatus')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Read Receipts</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.privacy.readReceipts}
                  onChange={() => togglePrivacy('readReceipts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="settings-section" style={{ animationDelay: '0.8s' }}>
          <h3 className="section-title">Support & Legal</h3>
          <div className="settings-card">
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Help Center</span>
              </div>
              <FiHelpCircle className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Privacy Policy</span>
              </div>
              <FiShield className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content">
                <span className="row-title">Terms of Service</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
          </div>
        </div>

        <button 
          className="logout-btn animate-fadeInUp" 
          style={{ animationDelay: '0.9s' }}
          onClick={() => navigate('/login')}
        >
          <FiLogOut style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Log Out
        </button>

      </div>
    </div>
  );
}
