import { useNavigate } from 'react-router-dom';
import { Home, Calendar, BarChart3, User } from 'lucide-react';

export default function NpBottomNav({ active = 'home' }) {
  const navigate = useNavigate();
  return (
    <div className="np-nav-wrap">
      <nav className="np-nav">
        <button className={`np-nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/np/home')}>
          <Home size={22} /><span>Home</span>
        </button>
        <button className={`np-nav-item ${active === 'events' ? 'active' : ''}`} onClick={() => navigate('/feed')}>
          <Calendar size={22} /><span>Events</span>
        </button>
        <button className={`np-nav-item ${active === 'activity' ? 'active' : ''}`} onClick={() => navigate('/np/activity')}>
          <BarChart3 size={22} /><span>Activity</span>
        </button>
        <button className={`np-nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => navigate('/np/profile')}>
          <User size={22} /><span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
