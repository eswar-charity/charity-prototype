import { Home, Search, Plus, Bookmark, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Guest-scoped bottom navigation. Keeps anonymous users inside the
 * /guest/* discovery flow and routes any identity-gated action (create,
 * saved) to the identity gate, per the Blueprint's Identity Gate Model.
 */
export default function GuestBottomNav({ active = 'discover' }) {
  const navigate = useNavigate();
  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav">
        <button className={`nav-item ${active === 'discover' ? 'active' : ''}`} onClick={() => navigate('/guest/feed')}>
          <Home size={22} /><span>Discover</span>
        </button>
        <button className={`nav-item ${active === 'search' ? 'active' : ''}`} onClick={() => navigate('/guest/empty')}>
          <Search size={22} /><span>Search</span>
        </button>
        <button className="nav-center-btn" onClick={() => navigate('/')} aria-label="Start an event">
          <Plus size={24} />
        </button>
        <button className={`nav-item ${active === 'saved' ? 'active' : ''}`} onClick={() => navigate('/guest/join')}>
          <Bookmark size={22} /><span>Saved</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/')}>
          <User size={22} /><span>Sign up</span>
        </button>
      </nav>
    </div>
  );
}
