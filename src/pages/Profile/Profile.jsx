import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSettings, FiEdit2, FiCheckCircle, FiInfo, FiPlus, 
  FiX, FiImage, FiHeart, FiActivity 
} from 'react-icons/fi';
import './Profile.css';
import { calculateBadge } from '../../utils/badgeEngine';

const API_BASE = 'http://localhost:5000/api';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Minimal edit state just for bio for now
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      // compute client-side badge if missing
      data.personalityBadge = data.personalityBadge || calculateBadge(data);
      setProfile(data);
      setEditBio(data.bio || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const calculateCompletion = (p) => {
    if (!p) return 0;
    let score = 0;
    const photos = p.profilePhotos || [];
    if (photos.length >= 4) score += 20;
    else score += photos.length * 5;
    
    if (p.bio && p.bio.length > 20) score += 15;
    if (p.drinkPreferences?.length >= 3) score += 15;
    if (p.interests?.length >= 3) score += 10;
    
    // New personality fields
    if (p.signatureSip) score += 10;
    if (p.socialVibe) score += 10;
    if (p.nightOutStyle?.length > 0) score += 10;
    if (p.prompts?.length >= 3) score += 10;

    return Math.min(100, score);
  };

  const getProfileTips = (p) => {
    if (!p) return [];
    const tips = [];
    if ((p.profilePhotos || []).length < 6) tips.push('Add more photos to increase profile visibility!');
    if (!p.signatureSip) tips.push('Add a Signature Sip to show off your taste.');
    if ((p.prompts || []).length < 3) tips.push('Answer 3 prompts to give matches conversation starters.');
    if (!p.bio || p.bio.length < 50) tips.push('Add more details to your bio for better quality matches.');
    return tips;
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/profile/personality`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: editBio })
      });
      setProfile({ ...profile, bio: editBio });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save bio');
    }
  };

  if (loading) return <div className="profile-container"><div className="loading-state">Loading profile...</div></div>;
  if (error) return <div className="profile-container"><div className="error-message">{error}</div></div>;
  if (!profile) return null;

  const completionPercent = calculateCompletion(profile);
  const photos = profile.profilePhotos?.length ? profile.profilePhotos : (profile.primaryPhoto ? [profile.primaryPhoto] : []);

  return (
    <div className="profile-container animate-fadeIn">
      {/* Top Bar */}
      <div className="profile-top-bar">
        <h1 className="profile-title">Profile</h1>
        <button className="settings-btn" onClick={() => navigate('/settings')}>
          <FiSettings />
        </button>
      </div>

      <div className="profile-content">
        
        {/* Header Info */}
        <div className="profile-info animate-fadeInUp">
          <div className="profile-name-row">
            <h2 className="profile-name">{profile.name}</h2>
            <span className="profile-age">{profile.age}</span>
            <FiCheckCircle className="verified-badge" />
          </div>
          <div className="profile-location">
            {profile.location || 'Location not set'}
          </div>
        </div>

        {/* Completion System */}
        <div className="completion-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="completion-header">
            <span className="completion-title">Profile Strength</span>
            <span className="completion-percent">{completionPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${completionPercent}%`, backgroundColor: completionPercent >= 80 ? 'var(--success)' : 'var(--primary)' }}></div>
          </div>
          <div className="profile-tips">
            {getProfileTips(profile).map((tip, idx) => (
              <div key={idx} className="tip-item">
                <FiInfo className="tip-icon" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Match Statistics */}
        <div className="stats-container animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card">
            <FiHeart className="stat-label" style={{ fontSize: '20px', color: 'var(--secondary)' }} />
            <span className="stat-value">--</span>
            <span className="stat-label">Total Likes</span>
          </div>
          <div className="stat-card">
            <FiActivity className="stat-label" style={{ fontSize: '20px', color: 'var(--primary)' }} />
            <span className="stat-value">--</span>
            <span className="stat-label">Matches</span>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="gallery-section animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="section-header">
            <h3 className="section-title">Photos</h3>
            {/* Note: Full photo edit is handled via onboarding/settings in real app */}
            <button className="edit-btn" onClick={() => navigate('/onboarding')}>
              <FiEdit2 /> Edit All
            </button>
          </div>
          <div className="photo-grid">
            {photos.map((photo, idx) => (
              <div key={idx} className={`photo-item ${idx === 0 ? 'main' : ''}`}>
                <img src={photo} alt={`Profile ${idx + 1}`} className="profile-img" />
              </div>
            ))}
            {photos.length < 6 && (
              <div className="photo-item" onClick={() => navigate('/onboarding')}>
                <div className="photo-add-btn"><FiPlus /></div>
              </div>
            )}
          </div>
        </div>

        {/* NEW: SipMatch Personality Layer */}
        <div className="personality-section animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: 'var(--accent)' }}>Your SipMatch Personality</h3>
          </div>
          
          <div className="personality-hero-card">
            <div className="personality-badge-large">{profile.personalityBadge || '🍻 SipMatch Explorer'}</div>
            
            <div className="personality-traits-grid">
              {profile.signatureSip && (
                <div className="trait-chip">
                  <span className="trait-icon">🥃</span>
                  <div className="trait-text">
                    <span className="trait-label">Signature Sip</span>
                    <span className="trait-value">{profile.signatureSip}</span>
                  </div>
                </div>
              )}
              {profile.drinkingMoment && (
                <div className="trait-chip">
                  <span className="trait-icon">✨</span>
                  <div className="trait-text">
                    <span className="trait-label">Vibe</span>
                    <span className="trait-value">{profile.drinkingMoment}</span>
                  </div>
                </div>
              )}
              {profile.socialVibe && (
                <div className="trait-chip">
                  <span className="trait-icon">⚡</span>
                  <div className="trait-text">
                    <span className="trait-label">Social Style</span>
                    <span className="trait-value">{profile.socialVibe}</span>
                  </div>
                </div>
              )}
              {profile.firstRoundOrder && (
                <div className="trait-chip">
                  <span className="trait-icon">🥂</span>
                  <div className="trait-text">
                    <span className="trait-label">First Round</span>
                    <span className="trait-value">{profile.firstRoundOrder}</span>
                  </div>
                </div>
              )}
            </div>

            {profile.nightOutStyle?.length > 0 && (
              <div className="night-out-tags">
                <span className="trait-label">Ideal Night Out:</span>
                <div className="tags-container" style={{ marginTop: '8px' }}>
                  {profile.nightOutStyle.map(style => (
                    <span key={style} className="tag highlight">{style}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prompts Section */}
        {profile.prompts && profile.prompts.length > 0 && (
          <div className="prompts-section animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <div className="section-header">
              <h3 className="section-title">Prompts</h3>
            </div>
            <div className="prompts-list">
              {profile.prompts.map((p, idx) => (
                <div key={idx} className="prompt-display-card">
                  <div className="prompt-question">{p.question}</div>
                  <div className="prompt-answer">{p.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About Me */}
        {profile.bio && (
          <div className="about-card animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="section-header">
              <h3 className="section-title">About Me</h3>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <FiEdit2 /> Edit
              </button>
            </div>
            <p className="about-text">{profile.bio}</p>
          </div>
        )}

        {/* Favorite Drinks & Interests */}
        <div className="about-card animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
          <div className="section-header">
            <h3 className="section-title">Drinks & Interests</h3>
          </div>
          {profile.drinkPreferences?.length > 0 && (
            <div className="tags-container" style={{ marginBottom: '16px' }}>
              {profile.drinkPreferences.map((drink, idx) => (
                <span key={`drink-${idx}`} className={`tag ${idx === 0 ? 'highlight' : ''}`}>
                  {idx === 0 ? '🥃 ' : ''}{drink}
                </span>
              ))}
            </div>
          )}
          {profile.interests?.length > 0 && (
            <div className="tags-container">
              {profile.interests.map((interest, idx) => (
                <span key={`interest-${idx}`} className="tag">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Bio Modal */}
      {isEditing && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content animate-slideInUp">
            <div className="modal-header">
              <h2 className="modal-title">Edit Bio</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <textarea 
                  className="form-textarea"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                  rows={5}
                />
                <span className="char-count">{editBio.length}/500</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
