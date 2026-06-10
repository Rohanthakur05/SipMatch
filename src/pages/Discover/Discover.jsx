import { useState, useRef, useEffect } from 'react';
import './Discover.css';

const MOCK_PROFILES = [
  {
    id: 1,
    name: 'Sarah',
    age: 26,
    location: '2 miles away',
    photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800'],
    verified: true,
    drinkPersonality: 'Whiskey Connoisseur 🥃',
    compatibility: 91,
    reasons: ['Loves Whiskey', 'Enjoys Live Music', 'Similar Music Taste'],
    bio: 'Looking for someone to explore hidden speakeasies with. I take my old fashioneds seriously.',
    interests: ['Live Jazz', 'Photography', 'Travel'],
    favoriteDrinks: ['Old Fashioned', 'Manhattan']
  },
  {
    id: 2,
    name: 'Michael',
    age: 28,
    location: '5 miles away',
    photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800'],
    verified: true,
    drinkPersonality: 'Craft Beer Hunter 🍺',
    compatibility: 85,
    reasons: ['Weekend Social Drinker', 'Loves Dogs', 'Outdoorsy'],
    bio: 'IPA enthusiast. If you know a good local brewery, we will get along great.',
    interests: ['Hiking', 'Dogs', 'Breweries'],
    favoriteDrinks: ['IPA', 'Stout']
  },
  {
    id: 3,
    name: 'Emily',
    age: 24,
    location: '1 mile away',
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'],
    verified: false,
    drinkPersonality: 'Cocktail Explorer 🍸',
    compatibility: 72,
    reasons: ['Loves Dancing', 'Foodie', 'Night Owl'],
    bio: 'Espresso martinis are my love language.',
    interests: ['Dancing', 'Sushi', 'Art Galleries'],
    favoriteDrinks: ['Espresso Martini', 'Margarita']
  }
];

export default function Discover() {
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [superLikes, setSuperLikes] = useState(5);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const diffX = e.clientX - dragStartPos.current.x;
    const diffY = e.clientY - dragStartPos.current.y;
    setDragOffset({ x: diffX, y: diffY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.releasePointerCapture(e.pointerId);
    }

    const threshold = 100;
    
    // Check swipe directions
    if (dragOffset.x > threshold) {
      handleSwipe('right');
    } else if (dragOffset.x < -threshold) {
      handleSwipe('left');
    } else if (dragOffset.y < -threshold && Math.abs(dragOffset.x) < 50) {
      handleSwipe('up');
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleSwipe = (direction) => {
    if (direction === 'up') {
      if (superLikes > 0) {
        setSuperLikes(prev => prev - 1);
      } else {
        // If no super likes, snap back (can add toast here later)
        setDragOffset({ x: 0, y: 0 });
        return;
      }
    }

    // Move card off screen
    const endX = direction === 'right' ? window.innerWidth : direction === 'left' ? -window.innerWidth : 0;
    const endY = direction === 'up' ? -window.innerHeight : 0;
    setDragOffset({ x: endX, y: endY });

    setTimeout(() => {
      // Logic for matching (mock 100% chance on right or up for demo purposes)
      if (direction === 'right' || direction === 'up') {
        const isMatch = true; 
        if (isMatch) {
          setMatchedProfile(profiles[currentIndex]);
          setShowMatchModal(true);
        }
      }

      setCurrentIndex(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
    }, 300); // Wait for animation
  };

  const renderCard = (profile, isTop) => {
    if (!profile) return null;

    const style = isTop ? {
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
      zIndex: 2
    } : {
      transform: `scale(${0.95 + Math.min(Math.abs(dragOffset.x) / 1000, 0.05)})`,
      opacity: 0.8 + Math.min(Math.abs(dragOffset.x) / 500, 0.2),
      zIndex: 1
    };

    return (
      <div 
        key={profile.id}
        ref={isTop ? cardRef : null}
        className={`profile-card ${isDragging && isTop ? 'dragging' : ''}`}
        style={style}
        onPointerDown={isTop ? handlePointerDown : undefined}
        onPointerMove={isTop ? handlePointerMove : undefined}
        onPointerUp={isTop ? handlePointerUp : undefined}
        onPointerCancel={isTop ? handlePointerUp : undefined}
      >
        <div className="card-image-container">
          <img src={profile.photos[0]} alt={profile.name} className="card-image" draggable="false" />
          <div className="image-overlay"></div>
          <div className="card-indicators">
            {profile.photos.map((_, i) => (
              <div key={i} className={`indicator ${i === 0 ? 'active' : ''}`}></div>
            ))}
          </div>
        </div>
        
        <div className="card-content">
          <div className="profile-header">
            <div className="name-age">
              <h2 className="name">{profile.name}</h2>
              <span className="age">{profile.age}</span>
              {profile.verified && <span className="verified-badge">✓</span>}
            </div>
          </div>
          
          <div className="location">📍 {profile.location}</div>
          
          <div className="drink-personality">{profile.drinkPersonality}</div>
          
          <div className="compatibility-section">
            <div className="comp-header">
              <span className="comp-score">{profile.compatibility}% Match</span>
            </div>
            <div className="comp-reasons">
              {profile.reasons.map((reason, i) => (
                <span key={i} className="reason-tag">{reason}</span>
              ))}
            </div>
          </div>
          
          <div className="bio-section">
            <div className="section-title">About Me</div>
            <p className="bio-text">{profile.bio}</p>
          </div>
          
          <div className="bio-section">
            <div className="section-title">Interests</div>
            <div className="tags-container">
              {profile.interests.map((interest, i) => (
                <span key={i} className="tag">{interest}</span>
              ))}
            </div>
          </div>

          <div className="bio-section">
            <div className="section-title">Favorite Drinks</div>
            <div className="tags-container">
              {profile.favoriteDrinks.map((drink, i) => (
                <span key={i} className="tag">{drink}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1 className="header-title">Discover</h1>
        <div className="premium-counter">
          ⭐ {superLikes} Super Likes
        </div>
      </div>

      <div className="cards-container">
        {currentIndex < profiles.length ? (
          <>
            {/* Render next card underneath */}
            {currentIndex + 1 < profiles.length && renderCard(profiles[currentIndex + 1], false)}
            {/* Render top card */}
            {renderCard(profiles[currentIndex], true)}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">🍷</div>
            <h3>Out of profiles!</h3>
            <p>Expand your distance or check back later for more potential matches.</p>
            <button className="btn-primary" onClick={() => setCurrentIndex(0)}>Refresh Profiles</button>
          </div>
        )}

        {currentIndex < profiles.length && (
          <div className="action-buttons">
            <button className="action-btn btn-pass" onClick={() => handleSwipe('left')}>✕</button>
            <button className="action-btn btn-super" onClick={() => handleSwipe('up')}>⭐</button>
            <button className="action-btn btn-like" onClick={() => handleSwipe('right')}>❤️</button>
          </div>
        )}
      </div>

      {showMatchModal && matchedProfile && (
        <div className="match-modal-overlay">
          <div className="match-modal">
            <h2 className="match-title">It's a Match!</h2>
            
            <div className="match-photos">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="You" className="match-photo user-photo" />
              <div className="match-icon">🥂</div>
              <img src={matchedProfile.photos[0]} alt={matchedProfile.name} className="match-photo" />
            </div>

            <div className="mutual-interests">
              <h4>Mutual Interests</h4>
              <div className="mutual-tags">
                <span className="reason-tag">Live Music</span>
                <span className="reason-tag">Craft Cocktails</span>
              </div>
            </div>

            <div className="match-buttons">
              <button className="btn-primary" onClick={() => setShowMatchModal(false)}>Start Chatting</button>
              <button className="btn-secondary" onClick={() => setShowMatchModal(false)}>Keep Exploring</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
