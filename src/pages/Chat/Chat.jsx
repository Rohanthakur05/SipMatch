import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import './Chat.css';

// Mock Data
const onlineUsers = [
  { id: 1, name: 'Sarah', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', isNew: true },
  { id: 2, name: 'Jessica', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', isNew: false },
  { id: 3, name: 'Emily', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', isNew: true },
  { id: 4, name: 'Chloe', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', isNew: false },
  { id: 5, name: 'Mia', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', isNew: false },
];

const chatList = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    lastMessage: 'That sounds like a great plan! 🍷',
    time: '2m',
    unread: 2,
    isOnline: true
  },
  {
    id: 2,
    name: 'Jessica Wong',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
    lastMessage: 'Are we still on for tomorrow?',
    time: '1h',
    unread: 0,
    isOnline: true
  },
  {
    id: 3,
    name: 'Emily Chen',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    lastMessage: 'Haha I loved that place too!',
    time: '5h',
    unread: 0,
    isOnline: false
  },
  {
    id: 4,
    name: 'Chloe Davis',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    lastMessage: 'What kind of music are you into?',
    time: 'Yesterday',
    unread: 1,
    isOnline: false
  }
];

export default function Chat() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chatList.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-container animate-fadeIn">
      <div className="chat-header">
        <h1 className="chat-title">Messages</h1>
        
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!searchQuery && (
        <div className="online-now-section animate-slideInRight">
          <h2 className="section-title">New Matches & Online</h2>
          <div className="online-list">
            {onlineUsers.map(user => (
              <div 
                key={`online-${user.id}`} 
                className="online-item"
                onClick={() => navigate(`/chat/${user.id}`)}
              >
                <div className={`avatar-wrapper ${!user.isNew ? 'read' : ''}`}>
                  <img src={user.image} alt={user.name} className="avatar" />
                  <div className="online-badge"></div>
                </div>
                <span className="online-name">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-list animate-fadeInUp">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <div 
              key={`chat-${chat.id}`} 
              className="chat-list-item"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="avatar-wrapper">
                <img src={chat.image} alt={chat.name} className="avatar" />
                {chat.isOnline && <div className="online-badge"></div>}
              </div>
              
              <div className="chat-info">
                <div className="chat-info-header">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-time">{chat.time}</span>
                </div>
                <div className="chat-preview-container">
                  <span className={`chat-preview ${chat.unread > 0 ? 'unread' : ''}`}>
                    {chat.lastMessage}
                  </span>
                  {chat.unread > 0 && (
                    <div className="unread-badge">{chat.unread}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FiMessageSquare className="empty-icon" />
            <h3>No messages found</h3>
            <p>Try a different search term or match with new people.</p>
          </div>
        )}
      </div>
    </div>
  );
}
