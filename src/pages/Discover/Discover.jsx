import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Discover.css';

const API_BASE = 'http://localhost:5000/api';

// Fallback placeholder photos for seeded/test accounts without Cloudinary photos
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
];

const getPhoto = (user, fallbackIdx = 0) => {
  if (user.primaryPhoto) return user.primaryPhoto;
  if (user.profilePhotos?.length > 0) return user.profilePhotos[0];
  return FALLBACK_PHOTOS[fallbackIdx % FALLBACK_PHOTOS.length];
};

export default function Discover() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [superLikes, setSuperLikes] = useState(5);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState(null); // { partner, compatibility }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // ── Fetch discover feed ──────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/discover`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load feed.');
      setProfiles(data.feed || []);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ── Send swipe to backend ─────────────────────────────────────────────────
  const sendSwipe = async (targetUserId, action) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/swipes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, action }),
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y,
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    cardRef.current?.releasePointerCapture(e.pointerId);

    const THRESHOLD = 100;
    if (dragOffset.x > THRESHOLD) handleSwipe('like');
    else if (dragOffset.x < -THRESHOLD) handleSwipe('pass');
    else if (dragOffset.y < -THRESHOLD && Math.abs(dragOffset.x) < 50) handleSwipe('superlike');
    else setDragOffset({ x: 0, y: 0 });
  };

  // ── Core swipe logic ─────────────────────────────────────────────────────
  const handleSwipe = async (action) => {
    const profile = profiles[currentIndex];
    if (!profile) return;

    if (action === 'superlike') {
      if (superLikes <= 0) { setDragOffset({ x: 0, y: 0 }); return; }
      setSuperLikes(prev => prev - 1);
    }

    // Fly the card off-screen
    const endX = action === 'like' ? window.innerWidth * 1.5 :
                 action === 'pass' ? -window.innerWidth * 1.5 : 0;
    const endY = action === 'superlike' ? -window.innerHeight * 1.5 : 0;
    setDragOffset({ x: endX, y: endY });

    // Fire API swipe
    const result = await sendSwipe(profile._id, action);

    setTimeout(() => {
      if (result?.matchCreated) {
        setMatchData({
          partner: result.match?.users?.find(u => u._id !== profile._id) || profile,
          compatibility: result.compatibility,
        });
        setShowMatchModal(true);
      }
      setCurrentIndex(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  // ── Swipe label overlay ──────────────────────────────────────────────────
  const getSwipeLabel = () => {
    if (dragOffset.x > 60) return { text: 'LIKE', color: '#10B981', side: 'left' };
    if (dragOffset.x < -60) return { text: 'NOPE', color: '#EF4444', side: 'right' };
    if (dragOffset.y < -60) return { text: 'SUPER', color: '#6C63FF', side: 'center' };
    return null;
  };

  // ── Card renderer ────────────────────────────────────────────────────────
  const renderCard = (profile, isTop, index) => {
    if (!profile) return null;
    const label = isTop ? getSwipeLabel() : null;
    const photo = getPhoto(profile, index);
    const compat = profile.compatibility || { score: 0, reasons: [] };

    const style = isTop
      ? { transform: `translate(${dragOffset.x}px,${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`, zIndex: 2 }
      : { transform: `scale(${0.95 + Math.min(Math.abs(dragOffset.x) / 1000, 0.05)})`, opacity: 0.8 + Math.min(Math.abs(dragOffset.x) / 500, 0.2), zIndex: 1 };

    return (
      <div
        key={profile._id || index}
        ref={isTop ? cardRef : null}
        className={`profile-card ${isDragging && isTop ? 'dragging' : ''}`}
        style={style}
        onPointerDown={isTop ? handlePointerDown : undefined}
        onPointerMove={isTop ? handlePointerMove : undefined}
        onPointerUp={isTop ? handlePointerUp : undefined}
        onPointerCancel={isTop ? handlePointerUp : undefined}
      >
        {/* Swipe indicator labels */}
        {label && (
          <div
            className="swipe-label"
            style={{
              color: label.color,
              borderColor: label.color,
              left: label.side === 'left' ? '16px' : undefined,
              right: label.side === 'right' ? '16px' : undefined,
              margin: label.side === 'center' ? '0 auto' : undefined,
              opacity: Math.min(1, Math.abs(dragOffset.x || dragOffset.y) / 80),
            }}
          >
            {label.text}
          </div>
        )}

        <div className="card-image-container">
          <img src={photo} alt={profile.name} className="card-image" draggable="false" />
          <div className="image-overlay"></div>
          <div className="card-indicators">
            {(profile.profilePhotos?.length > 0 ? profile.profilePhotos : [photo]).map((_, i) => (
              <div key={i} className={`indicator ${i === 0 ? 'active' : ''}`}></div>
            ))}
          </div>
        </div>

        <div className="card-content">
          <div className="profile-header">
            <div className="name-age">
              <h2 className="name">{profile.name}</h2>
              <span className="age">{profile.age || '?'}</span>
            </div>
          </div>

          <div className="location">📍 {profile.location || 'Nearby'}</div>

          {profile.personalityBadge && (
            <div className="drink-personality">{profile.personalityBadge}</div>
          )}

          <div className="tags-container" style={{ marginBottom: '16px' }}>
            {profile.drinkingMoment && <span className="tag highlight">{profile.drinkingMoment}</span>}
            {profile.socialVibe && <span className="tag highlight">{profile.socialVibe}</span>}
          </div>

          {compat.score > 0 && (
            <div className="compatibility-section">
              <div className="comp-header">
                <span className="comp-score">{compat.score}% Match</span>
              </div>
              <div className="comp-subtitle">Because:</div>
              <div className="comp-reasons-list">
                {compat.reasons.slice(0, 3).map((reason, i) => (
                  <div key={i} className="reason-item">
                    <span className="reason-check">✓</span> {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.prompts && profile.prompts.length > 0 && (
            <div className="bio-section">
              <div className="prompt-display-card" style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.2)' }}>
                <div className="prompt-question" style={{ color: 'var(--primary)' }}>{profile.prompts[0].question}</div>
                <div className="prompt-answer" style={{ fontSize: '1rem' }}>"{profile.prompts[0].answer}"</div>
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="bio-section">
              <div className="section-title">About Me</div>
              <p className="bio-text">{profile.bio}</p>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Interests</div>
              <div className="tags-container">
                {profile.interests.slice(0, 4).map((interest, i) => (
                  <span key={i} className="tag">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {profile.drinkPreferences?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Favorite Drinks</div>
              <div className="tags-container">
                {profile.drinkPreferences.slice(0, 3).map((drink, i) => (
                  <span key={i} className="tag">{drink}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1 className="header-title">Discover</h1>
        <div className="premium-counter">⭐ {superLikes} Super Likes</div>
      </div>

      <div className="cards-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-illustration">🍸</div>
            <h3>Finding your matches...</h3>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-illustration">⚠️</div>
            <h3>Couldn't load profiles</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchFeed}>Try Again</button>
          </div>
        ) : currentIndex < profiles.length ? (
          <>
            {currentIndex + 1 < profiles.length && renderCard(profiles[currentIndex + 1], false, currentIndex + 1)}
            {renderCard(profiles[currentIndex], true, currentIndex)}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">🍷</div>
            <h3>You've seen everyone!</h3>
            <p>Expand your distance or check back later for new profiles.</p>
            <button className="btn-primary" onClick={fetchFeed}>Refresh</button>
          </div>
        )}

        {!loading && !error && currentIndex < profiles.length && (
          <div className="action-buttons">
            <button className="action-btn btn-pass" onClick={() => handleSwipe('pass')}>✕</button>
            <button className="action-btn btn-super" onClick={() => handleSwipe('superlike')}>⭐</button>
            <button className="action-btn btn-like" onClick={() => handleSwipe('like')}>❤️</button>
          </div>
        )}
      </div>

      {/* Match Modal */}
      {showMatchModal && matchData && (
        <div className="match-modal-overlay">
          <div className="match-modal">
            <h2 className="match-title">It's a Match! 🥂</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              You and {matchData.partner?.name} both liked each other!
            </p>

            <div className="match-photos">
              <img
                src={localStorage.getItem('userPhoto') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                alt="You"
                className="match-photo user-photo"
              />
              <div className="match-icon">🥂</div>
              <img
                src={getPhoto(matchData.partner, 0)}
                alt={matchData.partner?.name}
                className="match-photo"
              />
            </div>

            {matchData.compatibility?.score > 0 && (
              <div className="mutual-interests">
                <h4>{matchData.compatibility.score}% Compatibility</h4>
                <div className="mutual-tags">
                  {matchData.compatibility.reasons.slice(0, 2).map((r, i) => (
                    <span key={i} className="reason-tag">{r}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="match-buttons">
              <button
                className="btn-primary"
                onClick={() => { setShowMatchModal(false); navigate('/chat'); }}
              >
                Start Chatting
              </button>
              <button className="btn-secondary" onClick={() => setShowMatchModal(false)}>
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
