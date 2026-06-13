import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding/Onboarding';
import Discover from './pages/Discover/Discover';
// import Matches from './pages/Matches/Matches';
import Chat from './pages/Chat/Chat';
import ChatRoom from './pages/Chat/ChatRoom';
// import Profile from './pages/Profile/Profile';
// import Settings from './pages/Settings/Settings';
// import BottomNav from './components/BottomNav';

const pagesWithNav = ['/discover', '/matches', '/chat', '/profile'];

export default function App() {
  const location = useLocation();
  const showNav = pagesWithNav.some(p => location.pathname.startsWith(p));

  return (
    <>
      <div className={showNav ? 'app-content with-nav' : 'app-content'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          {/* <Route path="/matches" element={<Matches />} /> */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          {/* <Route path="/profile" element={<Profile />} /> */}
          {/* <Route path="/settings" element={<Settings />} /> */}
        </Routes>
      </div>
      {/* {showNav && <BottomNav />} */}
    </>
  );
}
