import { useNavigate } from 'react-router-dom';
import { Home, Calendar, Activity, Settings } from 'lucide-react';

export default function NpBottomNav({ active = 'home' }) {
  const navigate = useNavigate();
  return (
    <nav className="np-nav">
      <button className={`np-nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/np/home')}>
        <Home size={22} /><span>Home</span>
      </button>
      <button className={`np-nav-item ${active === 'events' ? 'active' : ''}`} onClick={() => navigate('/np/approvals')}>
        <Calendar size={22} /><span>Events</span>
      </button>
      <button className={`np-nav-item ${active === 'activity' ? 'active' : ''}`} onClick={() => navigate('/np/activity')}>
        <Activity size={22} /><span>Activity</span>
      </button>
      <button className={`np-nav-item ${active === 'settings' ? 'active' : ''}`} onClick={() => navigate('/np/settings/autopilot')}>
        <Settings size={22} /><span>Settings</span>
      </button>
    </nav>
  );
}
