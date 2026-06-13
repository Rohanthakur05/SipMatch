import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiMoreVertical, FiSmile, FiSend, FiCheck, FiCheckCircle } from 'react-icons/fi';
import './Chat.css';

// Mock Data
const userProfile = {
  name: 'Sarah Jenkins',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  isOnline: true
};

const initialMessages = [
  { id: 1, text: 'Hey there! Nice to match with you.', sender: 'them', time: '10:30 AM', date: 'Today' },
  { id: 2, text: 'Hi Sarah! I see we both love whiskey and live music.', sender: 'me', time: '10:35 AM', date: 'Today', status: 'read' },
  { id: 3, text: 'Yes! Are you a bourbon or scotch fan?', sender: 'them', time: '10:38 AM', date: 'Today' },
  { id: 4, text: 'Definitely bourbon. Nothing beats a good Old Fashioned.', sender: 'me', time: '10:45 AM', date: 'Today', status: 'read' },
  { id: 5, text: 'That sounds like a great plan! 🍷', sender: 'them', time: '10:50 AM', date: 'Today' }
];

const matchReasons = [
  'Both enjoy whiskey',
  'Both love live music',
  'Similar music taste'
];

const conversationStarters = [
  "What's your go-to drink on a Friday night?",
  "Best cocktail you've ever tried?",
  "Whiskey or wine?",
  "Favorite place for a night out?"
];

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id } = useParams(); // Could use id to fetch specific user
  
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      status: 'sent'
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    
    // Simulate them typing and replying
    setTimeout(() => {
      // Mark as read
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Haha, I agree! 😄',
          sender: 'them',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today'
        }]);
      }, 2000);
    }, 1000);
  };

  const sendStarter = (text) => {
    setNewMessage(text);
  };

  return (
    <div className="chatroom-container animate-fadeIn">
      {/* Header */}
      <div className="chatroom-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiChevronLeft />
          </button>
          
          <div className="header-profile" onClick={() => navigate('/profile')}>
            <img src={userProfile.image} alt={userProfile.name} className="header-avatar" />
            <div className="header-info">
              <span className="header-name">{userProfile.name}</span>
              {userProfile.isOnline && (
                <span className="header-status">
                  <span className="status-dot"></span> Online
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="icon-btn">
            <FiMoreVertical />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {/* Premium Feature: Match Reminder */}
        <div className="match-reminder glass">
          <h3 className="reminder-title">Why you matched</h3>
          <div className="reminder-list">
            {matchReasons.map((reason, index) => (
              <div key={index} className="reminder-item">
                <span><FiCheckCircle /></span>
                {reason}
              </div>
            ))}
          </div>
        </div>

        <div className="date-divider">Today</div>

        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className="message-bubble">
              {msg.text}
            </div>
            <div className="message-meta">
              <span className="time">{msg.time}</span>
              {msg.sender === 'me' && (
                <span className={`read-status ${msg.status === 'read' ? 'read' : ''}`}>
                  {msg.status === 'read' ? <FiCheckCircle /> : <FiCheck />}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-wrapper them animate-fadeInUp">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Feature: Conversation Starters */}
      {messages.length < 10 && !isTyping && (
        <div className="starters-container">
          {conversationStarters.slice(0, 2).map((starter, i) => (
            <button 
              key={i} 
              className="starter-btn"
              onClick={() => sendStarter(starter)}
            >
              "{starter}"
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="input-wrapper">
          <div className="input-actions">
            <button type="button">
              <FiSmile />
            </button>
          </div>
          <textarea
            className="message-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
        </div>
        <button 
          type="submit" 
          className={`send-btn ${!newMessage.trim() ? 'disabled' : ''}`}
          disabled={!newMessage.trim()}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
