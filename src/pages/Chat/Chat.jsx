import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import { connectSocket, getSocket } from '../../utils/socketService';
import './Chat.css';

const API_BASE = 'http://localhost:5000/api';

const getPartnerPhoto = (partner) =>
  partner?.primaryPhoto || partner?.profilePhotos?.[0] || null;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000)      return 'Just now';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [onlineUsers, setOnlineUsers]     = useState(new Set());
  const socketRef = useRef(null);

  // ── Fetch matches (conversations) ──────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load conversations.');
      // Sort by lastActivity descending
      const sorted = (data.matches || []).sort(
        (a, b) => new Date(b.lastActivity || b.matchedAt) - new Date(a.lastActivity || a.matchedAt)
      );
      setConversations(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Socket: track online users + live last-message updates ─────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    const handleOnline  = ({ userId }) => setOnlineUsers((prev) => new Set([...prev, userId]));
    const handleOffline = ({ userId }) => setOnlineUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; });

    // When a new message arrives for ANY room update the conversation preview
    const handleMsg = ({ message }) => {
      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.matchId?.toString() !== message.match?.toString()) return c;
            return {
              ...c,
              lastMessage:   message.content,
              lastActivity:  message.createdAt,
              // If this chat isn't currently open, increment unread count
              unreadCount: (c.unreadCount || 0) + 1,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.lastActivity || b.matchedAt) - new Date(a.lastActivity || a.matchedAt)
          )
      );
    };

    socket.on('user_online',       handleOnline);
    socket.on('user_offline',      handleOffline);
    socket.on('receive_message',   handleMsg);

    return () => {
      socket.off('user_online',     handleOnline);
      socket.off('user_offline',    handleOffline);
      socket.off('receive_message', handleMsg);
    };
  }, []);

  const filtered = conversations.filter((c) =>
    (c.partner?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (matchId) => navigate(`/chat/${matchId}`);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="chat-container animate-fadeIn">
      {/* Header */}
      <div className="chat-header">
        <h1 className="chat-title">Messages</h1>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            id="chat-search"
            type="text"
            className="search-input"
            placeholder="Search matches…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Online / new matches strip */}
      {!searchQuery && conversations.length > 0 && (
        <div className="online-now-section animate-slideInRight">
          <h2 className="section-title">New Matches &amp; Online</h2>
          <div className="online-list">
            {conversations.slice(0, 8).map((c) => {
              const photo   = getPartnerPhoto(c.partner);
              const isOnline = onlineUsers.has(c.partner?._id?.toString());
              return (
                <div
                  key={`online-${c.matchId}`}
                  className="online-item"
                  onClick={() => handleOpen(c.matchId)}
                >
                  <div className={`avatar-wrapper ${!c.lastMessage ? '' : 'read'}`}>
                    {photo
                      ? <img src={photo} alt={c.partner?.name} className="avatar" />
                      : <div className="avatar avatar-placeholder">{c.partner?.name?.[0]}</div>
                    }
                    {isOnline && <div className="online-badge" />}
                  </div>
                  <span className="online-name">{c.partner?.name?.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="chat-list animate-fadeInUp">
        {loading ? (
          <div className="empty-state">
            <FiMessageSquare className="empty-icon" style={{ animation: 'pulse 2s infinite' }} />
            <p>Loading conversations…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: 'var(--error)' }}>{error}</p>
            <button
              style={{ marginTop: '1rem', color: 'var(--primary)', cursor: 'pointer' }}
              onClick={fetchConversations}
            >
              Try again
            </button>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((c) => {
            const photo    = getPartnerPhoto(c.partner);
            const isOnline = onlineUsers.has(c.partner?._id?.toString());
            const unread   = c.unreadCount || 0;
            const preview  =
              c.lastMessage ||
              c.compatibilityReasons?.[0] ||
              'You matched! Start the conversation 🍸';

            return (
              <div
                key={`chat-${c.matchId}`}
                id={`convo-${c.matchId}`}
                className="chat-list-item"
                onClick={() => handleOpen(c.matchId)}
              >
                <div className="avatar-wrapper">
                  {photo
                    ? <img src={photo} alt={c.partner?.name} className="avatar" />
                    : <div className="avatar avatar-placeholder">{c.partner?.name?.[0]}</div>
                  }
                  {isOnline && <div className="online-badge" />}
                </div>

                <div className="chat-info">
                  <div className="chat-info-header">
                    <span className="chat-name">{c.partner?.name || 'Match'}</span>
                    <span className="chat-time">
                      {formatTime(c.lastActivity || c.matchedAt)}
                    </span>
                  </div>
                  <div className="chat-preview-container">
                    <span className={`chat-preview ${unread > 0 ? 'unread' : ''}`}>
                      {preview.length > 55 ? preview.slice(0, 55) + '…' : preview}
                    </span>
                    {unread > 0 && (
                      <div className="unread-badge">{unread > 99 ? '99+' : unread}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <FiMessageSquare className="empty-icon" />
            {searchQuery
              ? <><h3>No results</h3><p>Try a different name.</p></>
              : <><h3>No conversations yet</h3><p>Go to Discover and swipe to match with someone!</p></>
            }
          </div>
        )}
      </div>
    </div>
  );
}
