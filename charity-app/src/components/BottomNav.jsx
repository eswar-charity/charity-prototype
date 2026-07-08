import { Home, Compass, Plus, Heart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav({ active = 'feed', onPlusClick }) {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav-wrap">
    <nav className="bottom-nav">
      <button
        className={`nav-item ${active === 'feed' ? 'active' : ''}`}
        onClick={() => navigate('/feed')}
      >
        <Home size={22} />
        <span>Feed</span>
      </button>
      <button
        className={`nav-item ${active === 'explore' ? 'active' : ''}`}
        onClick={() => navigate('/feed')}
      >
        <Compass size={22} />
        <span>Explore</span>
      </button>
      <button
        className="nav-center-btn"
        onClick={onPlusClick || (() => navigate('/create-event'))}
      >
        <Plus size={24} />
      </button>
      <button
        className={`nav-item ${active === 'activity' ? 'active' : ''}`}
        onClick={() => navigate('/post-event')}
      >
        <Heart size={22} fill={active === 'activity' ? 'var(--primary)' : 'none'} />
        <span>Activity</span>
      </button>
      <button
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <User size={22} />
        <span>Profile</span>
      </button>
    </nav>
    </div>
  );
}
