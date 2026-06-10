import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { path: '/discover', label: 'Discover', icon: '✨' },
  { path: '/matches', label: 'Matches', icon: '💝' },
  { path: '/chat', label: 'Chat', icon: '💬' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav glass">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
          (item.path === '/chat' && location.pathname.startsWith('/chat'));
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && <span className="bottom-nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
