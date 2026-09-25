import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronLeft, FiMoreVertical, FiSend, FiCheck, FiCheckCircle, FiInfo, FiX,
} from 'react-icons/fi';
import { connectSocket, getSocket } from '../../utils/socketService';
import './Chat.css';

const API_BASE = 'http://localhost:5000/api';
const MAX_MSG_LEN = 2000;
const TYPING_DEBOUNCE_MS = 1200;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPartnerPhoto = (partner) =>
  partner?.primaryPhoto || partner?.profilePhotos?.[0] || null;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr) => {
  if (!dateStr) return '';
  const d   = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

/** Build conversation starters from actual shared compatibility data */
const buildStarters = (compatibilityReasons = [], partner) => {
  const starters = [];
  if (!compatibilityReasons || compatibilityReasons.length === 0) return starters;

  compatibilityReasons.forEach((reason) => {
    const r = reason.toLowerCase();
    if (r.includes('rooftop'))       starters.push("You both love rooftop bars — which is your favourite spot?");
    else if (r.includes('whiskey') || r.includes('bourbon')) starters.push("You both love whiskey — bourbon or scotch?");
    else if (r.includes('music'))    starters.push("You have similar music taste — what's been on repeat lately?");
    else if (r.includes('jazz'))     starters.push("Fellow jazz lover! Best live jazz set you've been to?");
    else if (r.includes('cocktail')) starters.push("Fellow cocktail fan — what's your signature order?");
    else if (r.includes('sip'))      starters.push(`I see we share the same signature sip — ${partner?.signatureSip || 'great taste'}! ✨`);
    else if (r.includes('vibe'))     starters.push("Same social vibe — small intimate gatherings or big crowds?");
    else if (r.includes('interest')) starters.push("What are you up to this weekend?");
  });

  // Fallback starters that always make sense
  starters.push(
    "What's your go-to drink on a Friday night?",
    "Best bar you've discovered recently?",
  );

  // Unique, max 4
  return [...new Map(starters.map((s) => [s, s])).values()].slice(0, 4);
};

// ── ChatRoom component ────────────────────────────────────────────────────────
export default function ChatRoom() {
  const navigate   = useNavigate();
  const { id: matchId } = useParams();

  // Match / partner state
  const [match,    setMatch]   = useState(null);
  const [partner,  setPartner] = useState(null);
  const [myId,     setMyId]    = useState(null);

  // Message state
  const [messages,    setMessages]    = useState([]);
  const [newMessage,  setNewMessage]  = useState('');
  const [isTyping,    setIsTyping]    = useState(false);   // partner is typing
  const [sending,     setSending]     = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [msgError,    setMsgError]    = useState('');

  // UI state
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [inputError,    setInputError]    = useState('');
  const [allRead,       setAllRead]       = useState(false);
  const [showContext,   setShowContext]   = useState(false);

  const messagesEndRef  = useRef(null);
  const typingTimerRef  = useRef(null);
  const isTypingRef     = useRef(false); // debounce guard
  const socketRef       = useRef(null);
  const inputRef        = useRef(null);

  // ── Fetch match info + message history ─────────────────────────────────────
  const loadMatchAndMessages = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      // 1. Load match metadata
      const mRes  = await fetch(`${API_BASE}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mData = await mRes.json();
      if (!mRes.ok) throw new Error(mData.message || 'Failed to load match.');

      setMatch(mData.match);
      setPartner(mData.match.partner);
      setMyId(mData.match.self?._id?.toString());

      // 2. Load message history
      setLoadingMsgs(true);
      setMsgError('');
      const msgRes  = await fetch(`${API_BASE}/messages/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgData = await msgRes.json();
      if (!msgRes.ok) throw new Error(msgData.message || 'Failed to load messages.');
      const loadedMsgs = msgData.messages || [];
      setMessages(loadedMsgs);
      if (loadedMsgs.length === 0) setShowContext(true);
    } catch (err) {
      setMsgError(err.message);
    } finally {
      setLoadingMsgs(false);
    }
  }, [matchId, navigate]);

  useEffect(() => { loadMatchAndMessages(); }, [loadMatchAndMessages]);

  // ── Connect socket and join match room ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !matchId) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    // Join the match room
    const onConnect = () => {
      socket.emit('join_match', { matchId });
    };

    if (socket.connected) onConnect();
    else socket.on('connect', onConnect);

    // ── Incoming message ─────────────────────────────────────────────────
    const handleReceive = ({ message }) => {
      if (message.match?.toString() !== matchId) return;
      setMessages((prev) => {
        // Deduplicate (our own messages arrive back via broadcast)
        if (prev.some((m) => m._id?.toString() === message._id?.toString())) return prev;
        return [...prev, message];
      });

      // Immediately emit read receipt since this room is open
      socket.emit('message_read', { matchId });
    };

    // ── Read receipts ────────────────────────────────────────────────────
    const handleRead = ({ matchId: mid, readBy }) => {
      if (mid !== matchId) return;
      setMessages((prev) =>
        prev.map((m) => (m.sender?.toString() !== readBy ? { ...m, read: true } : m))
      );
      setAllRead(true);
    };

    // ── Typing indicators ────────────────────────────────────────────────
    const handleTypingStart = ({ matchId: mid }) => {
      if (mid === matchId) setIsTyping(true);
    };
    const handleTypingStop  = ({ matchId: mid }) => {
      if (mid === matchId) setIsTyping(false);
    };

    // ── Online status ────────────────────────────────────────────────────
    const handleOnlineStatus = ({ userId, isOnline }) => {
      if (userId?.toString() === partner?._id?.toString()) setPartnerOnline(isOnline);
    };
    const handleOnline  = ({ userId }) => {
      if (userId?.toString() === partner?._id?.toString()) setPartnerOnline(true);
    };
    const handleOffline = ({ userId }) => {
      if (userId?.toString() === partner?._id?.toString()) setPartnerOnline(false);
    };

    const handleSocketError = ({ message }) => {
      setMsgError(message);
    };

    socket.on('receive_message',   handleReceive);
    socket.on('message_read',      handleRead);
    socket.on('typing_start',      handleTypingStart);
    socket.on('typing_stop',       handleTypingStop);
    socket.on('user_online_status', handleOnlineStatus);
    socket.on('user_online',       handleOnline);
    socket.on('user_offline',      handleOffline);
    socket.on('error',             handleSocketError);

    return () => {
      socket.off('connect',          onConnect);
      socket.off('receive_message',  handleReceive);
      socket.off('message_read',     handleRead);
      socket.off('typing_start',     handleTypingStart);
      socket.off('typing_stop',      handleTypingStop);
      socket.off('user_online_status', handleOnlineStatus);
      socket.off('user_online',      handleOnline);
      socket.off('user_offline',     handleOffline);
      socket.off('error',            handleSocketError);
      socket.emit('leave_match', { matchId });
    };
  }, [matchId, partner]);

  // ── Mark messages as read when room opens ──────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (socket?.connected && matchId && messages.length > 0) {
      socket.emit('message_read', { matchId });
    }
  }, [matchId, messages.length]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Typing indicator emission ──────────────────────────────────────────────
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    setInputError('');

    const socket = socketRef.current;
    if (!socket?.connected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { matchId });
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_stop', { matchId });
    }, TYPING_DEBOUNCE_MS);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e?.preventDefault();
    const content = newMessage.trim();

    if (!content) return;
    if (content.length > MAX_MSG_LEN) {
      setInputError(`Message too long (${content.length}/${MAX_MSG_LEN})`);
      return;
    }

    const socket = socketRef.current;
    if (!socket?.connected) {
      setInputError('Not connected. Reconnecting…');
      return;
    }

    setSending(true);
    setInputError('');

    // Stop typing indicator
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socket.emit('typing_stop', { matchId });

    // Emit via Socket.io (server broadcasts back including to sender)
    socket.emit('send_message', { matchId, content });

    setNewMessage('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleStarter = (text) => {
    setNewMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Date divider grouping ──────────────────────────────────────────────────
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastDate = null;
    msgs.forEach((msg) => {
      const d = new Date(msg.createdAt).toDateString();
      if (d !== lastDate) {
        groups.push({ type: 'divider', label: formatDateDivider(msg.createdAt), key: `div-${d}` });
        lastDate = d;
      }
      groups.push({ type: 'message', msg, key: msg._id || msg.createdAt });
    });
    return groups;
  };

  // ── Compatibility + starters ───────────────────────────────────────────────
  const compatReasons  = match?.compatibilityReasons || [];
  const compatScore    = match?.compatibilityScore   || 0;
  const starters       = buildStarters(compatReasons, partner);
  const showStarters   = messages.length < 6 && !isTyping;

  // ── Render ──────────────────────────────────────────────────────────────────
  const partnerPhoto = getPartnerPhoto(partner);
  const partnerName  = partner?.name || 'Match';

  return (
    <div className="chatroom-container animate-fadeIn">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="chatroom-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/chat')} id="btn-back-chat">
            <FiChevronLeft />
          </button>

          <div className="header-profile">
            {partnerPhoto
              ? <img src={partnerPhoto} alt={partnerName} className="header-avatar" />
              : <div className="header-avatar avatar-placeholder">{partnerName[0]}</div>
            }
            <div className="header-info">
              <span className="header-name">{partnerName}</span>
              <span className="header-status">
                {partnerOnline
                  ? <><span className="status-dot" /> Online</>
                  : <span style={{ color: 'var(--text-muted)' }}>Active recently</span>
                }
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {compatScore > 0 && (
            <span className="header-compat">❤️ {compatScore}%</span>
          )}
          <button className={`icon-btn profile-toggle-btn ${showContext ? 'active' : ''}`} onClick={() => setShowContext(!showContext)}>
            <FiInfo />
          </button>
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <div className="messages-area">
        {/* Chat Profile Context (Collapsible) */}
        {showContext && partner && (
          <div className="chat-profile-context glass animate-fadeInDown">
            <div className="context-header">
              <span className="context-title">{partner.name}'s Vibe</span>
              <button className="context-close" onClick={() => setShowContext(false)}><FiX /></button>
            </div>
            <div className="context-grid">
              {partner.signatureSip && (
                <div className="context-row">
                  <span className="c-icon">🥃</span>
                  <div className="c-text">
                    <span className="c-label">Signature Sip</span>
                    <span className="c-value">{partner.signatureSip}</span>
                  </div>
                </div>
              )}
              {partner.nightOutStyle?.length > 0 && (
                <div className="context-row">
                  <span className="c-icon">🌃</span>
                  <div className="c-text">
                    <span className="c-label">Night Out</span>
                    <span className="c-value">{partner.nightOutStyle.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
              )}
              {partner.socialVibe && (
                <div className="context-row">
                  <span className="c-icon">😎</span>
                  <div className="c-text">
                    <span className="c-label">Vibe</span>
                    <span className="c-value">{partner.socialVibe}</span>
                  </div>
                </div>
              )}
            </div>
            {compatReasons.length > 0 && (
              <div className="context-compat">
                <span className="c-label">You both:</span>
                <ul>
                  {compatReasons.slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Loading / error states */}
        {loadingMsgs ? (
          <div className="messages-loading">
            <div className="loading-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span>Loading messages…</span>
          </div>
        ) : msgError ? (
          <div className="messages-error">
            <p>{msgError}</p>
            <button onClick={loadMatchAndMessages}>Retry</button>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-conversation">
            <div className="empty-conversation-icon">🍸</div>
            <p>No messages yet. Say hi!</p>
          </div>
        ) : null}

        {/* Message list with date dividers */}
        {groupMessagesByDate(messages).map((item) => {
          if (item.type === 'divider') {
            return <div key={item.key} className="date-divider">{item.label}</div>;
          }
          const msg    = item.msg;
          const isMine = msg.sender?.toString() === myId;
          const side   = isMine ? 'sent' : 'received';

          return (
            <div key={item.key} className={`message-wrapper ${side}`}>
              <div className="message-bubble">{msg.content}</div>
              <div className="message-meta">
                <span className="time">{formatTime(msg.createdAt)}</span>
                {isMine && (
                  <span className={`read-status ${msg.read ? 'read' : ''}`}>
                    {msg.read ? <FiCheckCircle /> : <FiCheck />}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Partner typing indicator */}
        {isTyping && (
          <div className="message-wrapper received animate-fadeInUp">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Conversation starters ────────────────────────────────────────── */}
      {showStarters && starters.length > 0 && (
        <div className="starters-container">
          {starters.map((s, i) => (
            <button
              key={i}
              id={`starter-${i}`}
              className="starter-btn"
              onClick={() => handleStarter(s)}
            >
              "{s}"
            </button>
          ))}
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="input-wrapper">
          <textarea
            id="message-input"
            ref={inputRef}
            className="message-input"
            placeholder="Type a message…"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_MSG_LEN}
            disabled={sending}
          />
        </div>
        {inputError && <div className="input-error">{inputError}</div>}
        <button
          id="btn-send-message"
          type="submit"
          className={`send-btn ${!newMessage.trim() || sending ? 'disabled' : ''}`}
          disabled={!newMessage.trim() || sending}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
