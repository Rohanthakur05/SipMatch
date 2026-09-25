import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Discover.css';

const API_BASE = 'http://localhost:5000/api';

// ── Photo helpers ─────────────────────────────────────────────────────────────
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
];

const getPhotos = (user) => {
  if (user.profilePhotos && user.profilePhotos.length > 0) return user.profilePhotos;
  if (user.primaryPhoto) return [user.primaryPhoto];
  return FALLBACK_PHOTOS;
};

// ── Discover component ────────────────────────────────────────────────────────
export default function Discover() {
  const navigate = useNavigate();

  // Feed state
  const [profiles, setProfiles]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [superLikes, setSuperLikes]   = useState(5);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);

  // Photo slider per-card state
  const [photoIndex, setPhotoIndex]   = useState(0);

  // Drag state
  const [dragOffset, setDragOffset]   = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]   = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cardRef      = useRef(null);

  // Match modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData]           = useState(null);

  // ── Fetch discover feed ─────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/discover?page=${pageNum}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load feed.');

      const newProfiles = data.feed || [];
      setProfiles((prev) => (append ? [...prev, ...newProfiles] : newProfiles));
      setPage(pageNum);
      setHasMore(pageNum < (data.totalPages || 1));
      if (!append) setCurrentIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  // Auto-load next page when 2 cards remain
  useEffect(() => {
    if (!loading && hasMore && profiles.length - currentIndex <= 2) {
      fetchFeed(page + 1, true);
    }
  }, [currentIndex, profiles.length, loading, hasMore, page, fetchFeed]);

  // Reset photo index when card changes
  useEffect(() => { setPhotoIndex(0); }, [currentIndex]);

  // ── Send swipe to backend ───────────────────────────────────────────────────
  const sendSwipe = async (targetUserId, action) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/swipes`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, action }),
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  // ── Drag / pointer handlers ─────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    // Ignore taps on photo navigation indicators
    if (e.target.closest('.card-indicators')) return;
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
    const VERT_THRESHOLD = 80;
    if      (dragOffset.x > THRESHOLD)                                      handleSwipe('like');
    else if (dragOffset.x < -THRESHOLD)                                     handleSwipe('pass');
    else if (dragOffset.y < -VERT_THRESHOLD && Math.abs(dragOffset.x) < 60) handleSwipe('superlike');
    else setDragOffset({ x: 0, y: 0 });
  };

  // ── Core swipe logic ────────────────────────────────────────────────────────
  const handleSwipe = async (action) => {
    const profile = profiles[currentIndex];
    if (!profile) return;

    if (action === 'superlike') {
      if (superLikes <= 0) { setDragOffset({ x: 0, y: 0 }); return; }
      setSuperLikes((prev) => prev - 1);
    }

    // Fly card off-screen
    const endX = action === 'like'      ? window.innerWidth * 1.6
               : action === 'pass'      ? -window.innerWidth * 1.6 : 0;
    const endY = action === 'superlike' ? -window.innerHeight * 1.6 : 0;
    setDragOffset({ x: endX, y: endY });

    const result = await sendSwipe(profile._id, action);

    setTimeout(() => {
      if (result?.matchCreated) {
        // Find current user's photo from match
        const currentUserPhoto =
          result.match?.users?.find((u) => u._id !== profile._id);
        setMatchData({
          partner:       result.match?.users?.find((u) => u._id === profile._id) || profile,
          currentUser:   currentUserPhoto,
          compatibility: result.compatibility,
          matchId:       result.match?._id,
        });
        setShowMatchModal(true);
      }
      setCurrentIndex((prev) => prev + 1);
      setDragOffset({ x: 0, y: 0 });
    }, 320);
  };

  // ── Photo navigation inside card ────────────────────────────────────────────
  const handlePhotoTap = (e, photos) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX > rect.width / 2) {
      setPhotoIndex((i) => Math.min(i + 1, photos.length - 1));
    } else {
      setPhotoIndex((i) => Math.max(i - 1, 0));
    }
  };

  // ── Swipe label overlay ─────────────────────────────────────────────────────
  const getSwipeLabel = () => {
    if (dragOffset.x > 60)  return { text: 'LIKE',  color: '#10B981' };
    if (dragOffset.x < -60) return { text: 'NOPE',  color: '#EF4444' };
    if (dragOffset.y < -60) return { text: 'SUPER', color: '#818CF8' };
    return null;
  };

  // ── Card renderer ───────────────────────────────────────────────────────────
  const renderCard = (profile, isTop, stackIndex) => {
    if (!profile) return null;

    const label  = isTop ? getSwipeLabel() : null;
    const photos = getPhotos(profile);
    const photo  = isTop ? photos[photoIndex] : photos[0];
    const compat = profile.compatibility || { score: 0, reasons: [] };

    const style = isTop
      ? {
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.04}deg)`,
          zIndex:    10,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        }
      : {
          transform: `scale(${0.95 + Math.min(Math.abs(dragOffset.x) / 1200, 0.05)}) translateY(${8 * stackIndex}px)`,
          opacity:   0.75 + Math.min(Math.abs(dragOffset.x) / 600, 0.25),
          zIndex:    10 - stackIndex,
        };

    return (
      <div
        key={profile._id || stackIndex}
        ref={isTop ? cardRef : null}
        className={`profile-card${isDragging && isTop ? ' dragging' : ''}`}
        style={style}
        onPointerDown={isTop ? handlePointerDown : undefined}
        onPointerMove={isTop ? handlePointerMove : undefined}
        onPointerUp={isTop   ? handlePointerUp   : undefined}
        onPointerCancel={isTop ? handlePointerUp : undefined}
      >
        {/* ── Swipe label ─────────────────────────────────────────────── */}
        {label && (
          <div
            className={`swipe-label swipe-label-${label.text.toLowerCase()}`}
            style={{
              color:       label.color,
              borderColor: label.color,
              opacity:     Math.min(1, Math.abs(dragOffset.x || dragOffset.y) / 80),
            }}
          >
            {label.text}
          </div>
        )}

        {/* ── Photo section ───────────────────────────────────────────── */}
        <div
          className="card-image-container"
          onClick={(e) => isTop && handlePhotoTap(e, photos)}
        >
          <img
            src={photo}
            alt={profile.name}
            className="card-image"
            draggable="false"
          />
          <div className="image-overlay" />

          {/* Photo indicators */}
          <div className="card-indicators">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`indicator${i === (isTop ? photoIndex : 0) ? ' active' : ''}`}
              />
            ))}
          </div>

          {/* Compatibility badge over image */}
          {compat.score > 0 && (
            <div className="compat-badge">
              ❤️ {compat.score}% Match
            </div>
          )}
        </div>

        {/* ── Card content ────────────────────────────────────────────── */}
        <div className="card-content">
          {/* Name + age */}
          <div className="profile-header">
            <div className="name-age">
              <h2 className="name">{profile.name}</h2>
              {profile.age && <span className="age">{profile.age}</span>}
            </div>
          </div>

          {/* Location */}
          {profile.location && (
            <div className="location">📍 {profile.location}</div>
          )}

          {/* Personality badge */}
          {profile.personalityBadge && (
            <div className="drink-personality">{profile.personalityBadge}</div>
          )}

          {/* Personality tags row */}
          <div className="tags-container" style={{ marginBottom: '12px' }}>
            {profile.signatureSip && (
              <span className="tag tag-sip">🍹 {profile.signatureSip}</span>
            )}
            {profile.drinkingMoment && (
              <span className="tag tag-moment">✨ {profile.drinkingMoment}</span>
            )}
            {profile.socialVibe && (
              <span className="tag tag-vibe">🎭 {profile.socialVibe}</span>
            )}
          </div>

          {/* Night out style */}
          {profile.nightOutStyle?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Night Out Style</div>
              <div className="tags-container">
                {profile.nightOutStyle.slice(0, 3).map((s, i) => (
                  <span key={i} className="tag tag-night">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility reasons */}
          {compat.score > 0 && compat.reasons.length > 0 && (
            <div className="compatibility-section">
              <div className="comp-header">
                <span className="comp-score">{compat.score}% Match</span>
              </div>
              <div className="comp-subtitle">You're both into…</div>
              <div className="comp-reasons-list">
                {compat.reasons.slice(0, 3).map((reason, i) => (
                  <div key={i} className="reason-item">
                    <span className="reason-check">✓</span> {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts */}
          {profile.prompts?.length > 0 && (
            <div className="bio-section">
              <div className="prompt-display-card">
                <div className="prompt-question">{profile.prompts[0].question}</div>
                <div className="prompt-answer">"{profile.prompts[0].answer}"</div>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="bio-section">
              <div className="section-title">About Me</div>
              <p className="bio-text">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Interests</div>
              <div className="tags-container">
                {profile.interests.slice(0, 5).map((interest, i) => (
                  <span key={i} className="tag">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {/* Drink preferences */}
          {profile.drinkPreferences?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Favourite Drinks</div>
              <div className="tags-container">
                {profile.drinkPreferences.slice(0, 4).map((drink, i) => (
                  <span key={i} className="tag tag-drink">🍸 {drink}</span>
                ))}
              </div>
            </div>
          )}

          {/* Music */}
          {profile.musicPreferences?.length > 0 && (
            <div className="bio-section">
              <div className="section-title">Music</div>
              <div className="tags-container">
                {profile.musicPreferences.slice(0, 3).map((m, i) => (
                  <span key={i} className="tag">🎵 {m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="discover-page">
      {/* Header */}
      <div className="discover-header">
        <h1 className="header-title">Discover</h1>
        <div className="premium-counter">⭐ {superLikes} Super Likes</div>
      </div>

      {/* Cards container */}
      <div className="cards-container">
        {loading && profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration loading-pulse">🍸</div>
            <h3>Finding your matches…</h3>
            <p>Calculating nightlife compatibility</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-illustration">⚠️</div>
            <h3>Couldn't load profiles</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => fetchFeed(1)}>Try Again</button>
          </div>
        ) : currentIndex < profiles.length ? (
          <>
            {/* Stack: show up to 3 background cards */}
            {[2, 1].map((offset) =>
              profiles[currentIndex + offset]
                ? renderCard(profiles[currentIndex + offset], false, offset)
                : null
            )}
            {renderCard(profiles[currentIndex], true, 0)}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">🍷</div>
            <h3>You've seen everyone!</h3>
            <p>Expand your preferences or check back soon for new people.</p>
            <button className="btn-primary" onClick={() => fetchFeed(1)}>Refresh</button>
          </div>
        )}

        {/* Action buttons */}
        {!loading && !error && currentIndex < profiles.length && (
          <div className="action-buttons">
            <button
              id="btn-pass"
              className="action-btn btn-pass"
              title="Pass (←)"
              onClick={() => handleSwipe('pass')}
            >
              ✕
            </button>
            <button
              id="btn-superlike"
              className={`action-btn btn-super${superLikes <= 0 ? ' disabled' : ''}`}
              title="Super Like (↑)"
              disabled={superLikes <= 0}
              onClick={() => handleSwipe('superlike')}
            >
              ⭐
            </button>
            <button
              id="btn-like"
              className="action-btn btn-like"
              title="Like (→)"
              onClick={() => handleSwipe('like')}
            >
              ❤️
            </button>
          </div>
        )}
      </div>

      {/* ── Match Modal ───────────────────────────────────────────────────── */}
      {showMatchModal && matchData && (
        <MatchModal
          matchData={matchData}
          onChat={() => {
            setShowMatchModal(false);
            navigate('/chat');
          }}
          onClose={() => setShowMatchModal(false)}
        />
      )}
    </div>
  );
}

// ── Match Modal component ─────────────────────────────────────────────────────
function MatchModal({ matchData, onChat, onClose }) {
  const { partner, compatibility } = matchData;
  const reasons = compatibility?.reasons || [];

  // Derive shared highlights (max 3)
  const highlights = reasons.slice(0, 3);

  const partnerPhoto =
    partner?.primaryPhoto ||
    partner?.profilePhotos?.[0] ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

  const myPhoto =
    localStorage.getItem('userPhoto') ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

  return (
    <div className="match-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="match-modal">
        {/* Confetti-style animated ring */}
        <div className="match-ring" />

        <h2 className="match-title">It's a Match! 🍸</h2>
        <p className="match-subtitle">
          You and <strong>{partner?.name}</strong> both liked each other!
        </p>

        {/* Photos */}
        <div className="match-photos">
          <div className="match-photo-wrap user-wrap">
            <img src={myPhoto}      alt="You"           className="match-photo user-photo" />
          </div>
          <div className="match-icon-center">🥂</div>
          <div className="match-photo-wrap">
            <img src={partnerPhoto} alt={partner?.name} className="match-photo" />
          </div>
        </div>

        {/* Compatibility score */}
        {compatibility?.score > 0 && (
          <div className="match-compat-score">
            <span className="compat-number">{compatibility.score}%</span>
            <span className="compat-label">Compatibility</span>
          </div>
        )}

        {/* Shared highlights */}
        {highlights.length > 0 && (
          <div className="mutual-interests">
            <h4 className="mutual-title">You're both into…</h4>
            <div className="mutual-tags">
              {highlights.map((r, i) => (
                <span key={i} className="reason-tag">{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="match-buttons">
          <button id="btn-start-chat" className="btn-primary" onClick={onChat}>
            💬 Start Chatting
          </button>
          <button id="btn-keep-discovering" className="btn-secondary" onClick={onClose}>
            Keep Discovering
          </button>
        </div>
      </div>
    </div>
  );
}
