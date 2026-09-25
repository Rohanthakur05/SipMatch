import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Matches.css';

const API_BASE = 'http://localhost:5000/api';

const getPhoto = (user) =>
  user?.primaryPhoto || user?.profilePhotos?.[0] || null;

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchMatches = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load matches.');
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleChat = (matchId) => navigate(`/chat/${matchId}`);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="matches-page">
      {/* Header */}
      <div className="matches-header">
        <h1 className="matches-title">Matches</h1>
        <span className="matches-count">
          {matches.length > 0 ? `${matches.length} match${matches.length !== 1 ? 'es' : ''}` : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="matches-empty">
          <div className="matches-empty-icon">🥂</div>
          <h3>Loading your matches…</h3>
        </div>
      ) : error ? (
        <div className="matches-empty">
          <div className="matches-empty-icon">⚠️</div>
          <h3>Couldn't load matches</h3>
          <p>{error}</p>
          <button className="m-btn-primary" onClick={fetchMatches}>Try Again</button>
        </div>
      ) : matches.length === 0 ? (
        <div className="matches-empty">
          <div className="matches-empty-icon">🍸</div>
          <h3>No matches yet</h3>
          <p>Start swiping on the Discover tab to find your perfect nightlife companion.</p>
          <button className="m-btn-primary" onClick={() => navigate('/discover')}>
            Start Discovering
          </button>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match) => (
            <MatchCard
              key={match.matchId}
              match={match}
              onChat={() => handleChat(match.matchId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Match card sub-component ──────────────────────────────────────────────────
function MatchCard({ match, onChat }) {
  const { partner, compatibilityScore, compatibilityReasons, matchedAt, lastMessage } = match;
  const photo = getPhoto(partner);

  const dateStr = matchedAt
    ? new Date(matchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="match-card" id={`match-${match.matchId}`}>
      {/* Avatar */}
      <div className="match-avatar-wrap">
        {photo
          ? <img src={photo} alt={partner?.name} className="match-avatar" />
          : <div className="match-avatar match-avatar-placeholder">
              {partner?.name?.[0] || '?'}
            </div>
        }
        <div className="match-online-dot" />
      </div>

      {/* Info */}
      <div className="match-info">
        <div className="match-top-row">
          <span className="match-name">{partner?.name || 'Mystery Match'}</span>
          <span className="match-date">{dateStr}</span>
        </div>

        {/* Compat score */}
        {compatibilityScore > 0 && (
          <div className="match-compat">
            <span className="compat-pill">❤️ {compatibilityScore}% Match</span>
            {partner?.personalityBadge && (
              <span className="badge-pill">{partner.personalityBadge}</span>
            )}
          </div>
        )}

        {/* Last message or detailed compatibility info */}
        {lastMessage ? (
          <div className="match-preview">
            {lastMessage.length > 60 ? lastMessage.slice(0, 60) + '…' : lastMessage}
          </div>
        ) : (
          <div className="match-reasons-preview">
            {partner?.signatureSip && (
              <div className="reason-line">🍹 <strong>Sip:</strong> {partner.signatureSip}</div>
            )}
            {compatibilityReasons?.length > 0 ? (
              <>
                <div className="reason-line"><strong>You both:</strong></div>
                {compatibilityReasons.slice(0, 3).map((r, i) => (
                  <div key={i} className="reason-line-item">✓ {r}</div>
                ))}
              </>
            ) : (
              <div className="match-preview">Start the conversation!</div>
            )}
          </div>
        )}
      </div>

      {/* Chat button */}
      <button
        className="match-chat-btn"
        id={`chat-btn-${match.matchId}`}
        onClick={onChat}
        title="Open chat"
      >
        💬
      </button>
    </div>
  );
}
