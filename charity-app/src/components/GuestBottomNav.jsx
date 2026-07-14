import { useState } from 'react';
import { Home, Search, Plus, Bookmark, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileJoinModal from './MobileJoinModal';

/**
 * Guest-scoped bottom navigation. Keeps anonymous users inside the
 * /guest/* discovery flow and routes any identity-gated action (search,
 * saved) to the identity gate, per the Blueprint's Identity Gate Model.
 * The gate opens as a bottom sheet over the current screen.
 */
export default function GuestBottomNav({ active = 'discover' }) {
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav">
        <button className={`nav-item ${active === 'discover' ? 'active' : ''}`} onClick={() => navigate('/guest/feed')}>
          <Home size={22} /><span>Discover</span>
        </button>
        <button className={`nav-item ${active === 'search' ? 'active' : ''}`} onClick={() => setShowJoin(true)}>
          <Search size={22} /><span>Search</span>
        </button>
        <button className="nav-center-btn" onClick={() => navigate('/')} aria-label="Start an event">
          <Plus size={24} />
        </button>
        <button className={`nav-item ${active === 'saved' ? 'active' : ''}`} onClick={() => setShowJoin(true)}>
          <Bookmark size={22} /><span>Saved</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/')}>
          <User size={22} /><span>Sign up</span>
        </button>
      </nav>
      {showJoin && <MobileJoinModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
