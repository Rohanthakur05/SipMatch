import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSettings, FiEdit2, FiCheckCircle, FiInfo, FiPlus, 
  FiX, FiImage, FiHeart, FiMessageSquare, FiActivity 
} from 'react-icons/fi';
import './Profile.css';

// Mock Data
const initialProfile = {
  name: 'Alex',
  age: 26,
  location: 'New York, NY',
  verified: true,
  bio: 'Just looking for someone to explore the city\'s best hidden speakeasies. I make a mean Old Fashioned and order too much late-night pizza.',
  photos: [
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
  ],
  personality: {
    type: 'Whiskey Connoisseur',
    emoji: '🥃',
    desc: 'You appreciate the finer things. You prefer deep conversations over loud clubs and know exactly how you like your drink served.'
  },
  drinks: ['Bourbon', 'Old Fashioned', 'Stout Beer', 'Red Wine'],
  interests: ['Live Jazz', 'Photography', 'Late Night Diners', 'Vinyl Records'],
  stats: {
    likes: 124,
    matches: 28,
    conversations: 5
  }
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(profile.bio);

  // Calculate Profile Completion
  const calculateCompletion = () => {
    let score = 0;
    if (profile.photos.length >= 4) score += 40;
    else score += profile.photos.length * 10;
    
    if (profile.bio.length > 20) score += 20;
    if (profile.drinks.length >= 3) score += 20;
    if (profile.interests.length >= 3) score += 20;
    
    return Math.min(100, score);
  };

  const completionPercent = calculateCompletion();

  const handleSave = () => {
    setProfile({ ...profile, bio: editBio });
    setIsEditing(false);
  };

  const getProfileTips = () => {
    const tips = [];
    if (profile.photos.length < 6) tips.push('Add more photos to increase profile visibility by 30%!');
    if (profile.bio.length < 50) tips.push('Add more details to your bio for better quality matches.');
    if (profile.interests.length < 5) tips.push('Adding more interests helps our algorithm find your perfect match.');
    return tips;
  };

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
            {profile.verified && <FiCheckCircle className="verified-badge" />}
          </div>
          <div className="profile-location">
            {profile.location}
          </div>
        </div>

        {/* Completion System */}
        <div className="completion-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="completion-header">
            <span className="completion-title">Profile Strength</span>
            <span className="completion-percent">{completionPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
          </div>
          <div className="profile-tips">
            {getProfileTips().map((tip, idx) => (
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
            <span className="stat-value">{profile.stats.likes}</span>
            <span className="stat-label">Total Likes</span>
          </div>
          <div className="stat-card">
            <FiActivity className="stat-label" style={{ fontSize: '20px', color: 'var(--primary)' }} />
            <span className="stat-value">{profile.stats.matches}</span>
            <span className="stat-label">Matches</span>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="gallery-section animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="section-header">
            <h3 className="section-title">Photos</h3>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <FiEdit2 /> Edit
            </button>
          </div>
          <div className="photo-grid">
            {profile.photos.map((photo, idx) => (
              <div key={idx} className={`photo-item ${idx === 0 ? 'main' : ''}`}>
                <img src={photo} alt={`Profile ${idx + 1}`} className="profile-img" />
              </div>
            ))}
            {profile.photos.length < 6 && (
              <div className="photo-item" onClick={() => setIsEditing(true)}>
                <div className="photo-add-btn">
                  <FiPlus />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drink Personality Card */}
        <div className="personality-card animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="personality-badge">{profile.personality.emoji}</div>
          <h3 className="personality-type">{profile.personality.type}</h3>
          <p className="personality-desc">{profile.personality.desc}</p>
        </div>

        {/* About Me */}
        <div className="about-card animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <div className="section-header">
            <h3 className="section-title">About Me</h3>
          </div>
          <p className="about-text">{profile.bio}</p>
        </div>

        {/* Favorite Drinks & Interests */}
        <div className="about-card animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <div className="section-header">
            <h3 className="section-title">Drinks & Interests</h3>
          </div>
          <div className="tags-container" style={{ marginBottom: '16px' }}>
            {profile.drinks.map((drink, idx) => (
              <span key={`drink-${idx}`} className={`tag ${idx === 0 ? 'highlight' : ''}`}>
                {idx === 0 ? '🥃 ' : ''}{drink}
              </span>
            ))}
          </div>
          <div className="tags-container">
            {profile.interests.map((interest, idx) => (
              <span key={`interest-${idx}`} className="tag">
                {interest}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content animate-slideInUp">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Manage Photos (Min 4)</label>
                <div className="photo-grid">
                  {profile.photos.map((photo, idx) => (
                    <div key={idx} className="photo-item">
                      <img src={photo} alt={`Edit ${idx + 1}`} className="profile-img" />
                      <div className="photo-action delete">
                        <FiX />
                      </div>
                    </div>
                  ))}
                  {profile.photos.length < 6 && (
                    <div className="photo-item">
                      <div className="photo-add-btn">
                        <FiImage />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">About Me</label>
                <textarea 
                  className="form-textarea"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={500}
                />
                <span className="char-count">{editBio.length}/500</span>
              </div>
              
              <div className="form-group">
                <label className="form-label">Top Interests (Coming soon)</label>
                {/* Placeholder for complex editing logic */}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Interest editing will be available in the next update.
                </p>
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
