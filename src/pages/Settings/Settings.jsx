import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiStar, FiCheck,
  FiLogOut, FiHelpCircle, FiShield, FiSave, FiLoader
} from 'react-icons/fi';
import { disconnectSocket } from '../../utils/socketService';
import './Settings.css';

const API_BASE = 'http://localhost:5000/api';

const DRINK_OPTIONS    = ['Whiskey', 'Beer', 'Wine', 'Vodka', 'Rum', 'Gin', 'Cocktails', 'Tequila', 'Champagne', 'Sake'];
const INTEREST_OPTIONS = ['Live Music', 'Clubs', 'Pubs', 'Travel', 'Fitness', 'Movies', 'Gaming', 'Foodie', 'Sports', 'Coffee', 'Art', 'Comedy'];
const LOOKING_FOR_OPS  = ['Dating', 'Friendship', 'Drinking Buddy', 'Networking', 'Casual Meetups'];

// Safe defaults for when API data hasn't loaded yet
const DEFAULT_SETTINGS = {
  discoveryPreferences: { ageMin: 21, ageMax: 35, lookingFor: 'Dating' },
  drinkPreferences: [],
  interests: [],
  notifications: { newMatch: true, newMessage: true, profileLike: false, appUpdates: true, promotional: false },
  privacy: { showDistance: true, showAge: true, showOnlineStatus: true, profileVisibility: true, readReceipts: true },
};

export default function Settings() {
  const navigate = useNavigate();

  const [settings,   setSettings]   = useState(DEFAULT_SETTINGS);
  const [userEmail,  setUserEmail]   = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [saveError,  setSaveError]  = useState('');
  const [lookingForOpen, setLookingForOpen] = useState(false);

  // ── Load real settings from backend ────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res  = await fetch(`${API_BASE}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUserEmail(data.email || '');
      setSettings({
        discoveryPreferences: data.discoveryPreferences || DEFAULT_SETTINGS.discoveryPreferences,
        drinkPreferences:     data.drinkPreferences     || [],
        interests:            data.interests            || [],
        notifications:        data.notifications        || DEFAULT_SETTINGS.notifications,
        privacy:              data.privacy              || DEFAULT_SETTINGS.privacy,
      });
    } catch {
      // Use defaults silently — page is still functional
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Persist settings to backend ────────────────────────────────────────────
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const res  = await fetch(`${API_BASE}/profile/settings`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          discoveryPreferences: settings.discoveryPreferences,
          drinkPreferences:     settings.drinkPreferences,
          interests:            settings.interests,
          notifications:        settings.notifications,
          privacy:              settings.privacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSaveMsg('Settings saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhoto');
    // Disconnect socket
    disconnectSocket();
    navigate('/login');
  };

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  const toggleNotif  = (k) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [k]: !p.notifications[k] } }));
  const togglePrivacy = (k) => setSettings(p => ({ ...p, privacy: { ...p.privacy, [k]: !p.privacy[k] } }));
  const setDP        = (k, v) => setSettings(p => ({ ...p, discoveryPreferences: { ...p.discoveryPreferences, [k]: v } }));

  const toggleDrink = (drink) => {
    setSettings(p => ({
      ...p,
      drinkPreferences: p.drinkPreferences.includes(drink)
        ? p.drinkPreferences.filter(d => d !== drink)
        : [...p.drinkPreferences, drink],
    }));
  };

  const toggleInterest = (tag) => {
    setSettings(p => ({
      ...p,
      interests: p.interests.includes(tag)
        ? p.interests.filter(t => t !== tag)
        : [...p.interests, tag],
    }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="settings-container animate-fadeIn">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/profile')} id="btn-back-settings">
          <FiChevronLeft />
        </button>
        <h1 className="settings-title">Settings</h1>
        <button
          id="btn-save-settings"
          className={`settings-save-btn ${saving ? 'saving' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '…' : <FiSave />}
          {saving ? 'Saving' : 'Save'}
        </button>
      </div>

      {/* Save feedback */}
      {saveMsg   && <div className="save-banner success">{saveMsg}</div>}
      {saveError && <div className="save-banner error">{saveError}</div>}

      <div className="settings-content">

        {/* Premium card */}
        <div className="premium-card animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          <FiStar className="premium-icon" />
          <h2 className="premium-title">SipMatch Premium</h2>
          <div className="premium-features">
            {['Unlimited Likes & Swipes', 'Advanced Drink Filters', 'Priority Profile Visibility', 'See Who Liked You'].map(f => (
              <div key={f} className="premium-feature"><FiCheck className="premium-feature-icon" /><span>{f}</span></div>
            ))}
          </div>
          <button className="premium-btn" disabled>Coming Soon</button>
        </div>

        {/* Account */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h3 className="section-title">Account</h3>
          <div className="settings-card">
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Email</span>
                <span className="row-subtitle">{loading ? '…' : (userEmail || 'Not set')}</span>
              </div>
            </div>
            <div className="settings-row clickable" onClick={() => navigate('/onboarding')}>
              <div className="row-content">
                <span className="row-title">Edit Full Profile</span>
                <span className="row-subtitle">Photos, prompts, personality</span>
              </div>
              <FiChevronRight className="row-value" />
            </div>
          </div>
        </div>

        {/* Discovery Preferences */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h3 className="section-title">Discovery Preferences</h3>
          <div className="settings-card">

            <div className="slider-container">
              <div className="slider-header">
                <span className="slider-title">Min Age</span>
                <span className="slider-value">{settings.discoveryPreferences.ageMin}</span>
              </div>
              <input
                id="slider-age-min"
                type="range" min="18" max="60"
                value={settings.discoveryPreferences.ageMin}
                onChange={(e) => setDP('ageMin', Math.min(Number(e.target.value), settings.discoveryPreferences.ageMax - 1))}
                className="range-slider"
              />
            </div>

            <div className="slider-container">
              <div className="slider-header">
                <span className="slider-title">Max Age</span>
                <span className="slider-value">{settings.discoveryPreferences.ageMax}</span>
              </div>
              <input
                id="slider-age-max"
                type="range" min="18" max="80"
                value={settings.discoveryPreferences.ageMax}
                onChange={(e) => setDP('ageMax', Math.max(Number(e.target.value), settings.discoveryPreferences.ageMin + 1))}
                className="range-slider"
              />
            </div>

            {/* Looking For */}
            <div className="settings-row clickable" onClick={() => setLookingForOpen(v => !v)}>
              <div className="row-content">
                <span className="row-title">Looking For</span>
                <span className="row-subtitle">{settings.discoveryPreferences.lookingFor}</span>
              </div>
              <FiChevronRight className={`row-value ${lookingForOpen ? 'rotated' : ''}`} />
            </div>
            {lookingForOpen && (
              <div className="option-list">
                {LOOKING_FOR_OPS.map(opt => (
                  <div
                    key={opt}
                    className={`option-item ${settings.discoveryPreferences.lookingFor === opt ? 'selected' : ''}`}
                    onClick={() => { setDP('lookingFor', opt); setLookingForOpen(false); }}
                  >
                    {settings.discoveryPreferences.lookingFor === opt && <FiCheck style={{ color: 'var(--primary)', marginRight: '8px' }} />}
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drink Preferences */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h3 className="section-title">Drink Preferences</h3>
          <p className="section-hint">Affects your discovery feed and compatibility score.</p>
          <div className="settings-card">
            <div className="chips-container">
              {DRINK_OPTIONS.map(drink => (
                <div
                  key={drink}
                  id={`chip-drink-${drink.toLowerCase()}`}
                  className={`chip ${settings.drinkPreferences.includes(drink) ? 'selected' : ''}`}
                  onClick={() => toggleDrink(drink)}
                >
                  {settings.drinkPreferences.includes(drink) && '✓ '}{drink}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <h3 className="section-title">Interests &amp; Lifestyle</h3>
          <div className="settings-card">
            <div className="chips-container">
              {INTEREST_OPTIONS.map(tag => (
                <div
                  key={tag}
                  id={`chip-interest-${tag.toLowerCase().replace(/\s/g, '-')}`}
                  className={`chip ${settings.interests.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <h3 className="section-title">Notifications</h3>
          <div className="settings-card">
            {[
              { key: 'newMatch',    label: 'New Matches' },
              { key: 'newMessage',  label: 'Messages' },
              { key: 'appUpdates',  label: 'App Updates' },
              { key: 'promotional', label: 'Promotions' },
            ].map(({ key, label }) => (
              <div key={key} className="settings-row">
                <div className="row-content"><span className="row-title">{label}</span></div>
                <label className="toggle-switch">
                  <input
                    id={`notif-${key}`}
                    type="checkbox"
                    checked={settings.notifications[key]}
                    onChange={() => toggleNotif(key)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title">Profile Likes</span>
                <span className="row-subtitle">Requires Premium</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" disabled checked={false} />
                <span className="toggle-slider" style={{ opacity: 0.4 }} />
              </label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <h3 className="section-title">Privacy</h3>
          <div className="settings-card">
            {[
              { key: 'showAge',          label: 'Show Age on Profile' },
              { key: 'showOnlineStatus', label: 'Show Online Status' },
              { key: 'readReceipts',     label: 'Read Receipts' },
              { key: 'profileVisibility',label: 'Profile Visible in Discovery' },
            ].map(({ key, label }) => (
              <div key={key} className="settings-row">
                <div className="row-content"><span className="row-title">{label}</span></div>
                <label className="toggle-switch">
                  <input
                    id={`privacy-${key}`}
                    type="checkbox"
                    checked={settings.privacy[key]}
                    onChange={() => togglePrivacy(key)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
          <h3 className="section-title">Support &amp; Legal</h3>
          <div className="settings-card">
            <div className="settings-row clickable">
              <div className="row-content"><span className="row-title">Help Center</span></div>
              <FiHelpCircle className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content"><span className="row-title">Privacy Policy</span></div>
              <FiShield className="row-value" />
            </div>
            <div className="settings-row clickable">
              <div className="row-content"><span className="row-title">Terms of Service</span></div>
              <FiChevronRight className="row-value" />
            </div>
            <div className="settings-row">
              <div className="row-content">
                <span className="row-title" style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  SipMatch v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings-section animate-fadeInUp" style={{ animationDelay: '0.75s' }}>
          <div className="settings-card">
            <div className="settings-row clickable" style={{ opacity: 0.7 }}>
              <div className="row-content">
                <span className="row-title" style={{ color: 'var(--error)' }}>Delete Account</span>
                <span className="row-subtitle">This action is irreversible</span>
              </div>
              <FiChevronRight className="row-value" style={{ color: 'var(--error)' }} />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="btn-logout"
          className="logout-btn animate-fadeInUp"
          style={{ animationDelay: '0.8s' }}
          onClick={handleLogout}
        >
          <FiLogOut style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Log Out
        </button>

      </div>
    </div>
  );
}
