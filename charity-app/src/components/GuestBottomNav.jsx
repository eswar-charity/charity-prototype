import { useState } from 'react';
import { Home, Search, Plus, Bookmark, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileJoinModal from './MobileJoinModal';
import { useAuth } from '../auth/AuthContext';
import { resetDraft } from '../hooks/useCreateEventDraft';

/**
 * Guest-scoped bottom navigation. Keeps anonymous users inside the
 * /guest/* discovery flow and routes any identity-gated action (search,
 * saved) to the identity gate, per the Blueprint's Identity Gate Model.
 * When the user is already authenticated, labels/routes match signed-in chrome.
 */
export default function GuestBottomNav({ active = 'discover' }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showJoin, setShowJoin] = useState(false);
  const [gateIntent, setGateIntent] = useState('default');
  const homePath = isAuthenticated ? '/feed' : '/guest/feed';

  const openGate = (intent = 'default') => {
    setGateIntent(intent);
    setShowJoin(true);
  };

  const startEvent = () => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    resetDraft();
    navigate('/event/step-1');
  };

  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav">
        <button className={`nav-item ${active === 'discover' ? 'active' : ''}`} onClick={() => navigate(homePath)}>
          <Home size={22} /><span>Discover</span>
        </button>
        <button
          className={`nav-item ${active === 'search' ? 'active' : ''}`}
          onClick={() => (isAuthenticated ? navigate('/feed') : openGate('default'))}
        >
          <Search size={22} /><span>Search</span>
        </button>
        <button
          className="nav-center-btn"
          onClick={startEvent}
          aria-label="Start an event"
        >
          <Plus size={24} />
        </button>
        <button
          className={`nav-item ${active === 'saved' ? 'active' : ''}`}
          onClick={() => (isAuthenticated ? navigate('/profile') : openGate('saved'))}
        >
          <Bookmark size={22} /><span>Saved</span>
        </button>
        <button className="nav-item" onClick={() => navigate(isAuthenticated ? '/profile' : '/')}>
          <User size={22} /><span>{isAuthenticated ? 'Profile' : 'Sign up'}</span>
        </button>
      </nav>
      {showJoin && <MobileJoinModal intent={gateIntent} onClose={() => setShowJoin(false)} />}
    </div>
  );
}
