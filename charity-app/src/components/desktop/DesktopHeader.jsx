import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Logo from '../Logo';

const NAV_LINKS = ['Discover', 'How it works', 'Causes', 'For nonprofits'];

export default function DesktopHeader({ active = 'Discover', loggedIn = false, avatarInitials = 'SJ', homePath = '/guest/feed', showSearch = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToCauses = () => {
    window.setTimeout(() => {
      document.getElementById('dsk-feed-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleNav = (link) => {
    if (link === 'Discover') {
      navigate(homePath);
      return;
    }
    if (link === 'Causes') {
      if (location.pathname === '/guest/feed') {
        navigate('/guest/feed?view=causes');
        scrollToCauses();
      } else {
        navigate('/guest/feed?view=causes');
      }
      return;
    }
    if (link === 'For nonprofits') navigate('/np/home');
    else navigate('/event/step-1');
  };

  return (
    <header className="dsk-header">
      <div className="dsk-header-inner">
        <Logo height={26} tone="dark" onClick={() => navigate(homePath)} style={{ cursor: 'pointer' }} />

        <nav className="dsk-nav">
          {NAV_LINKS.map((link) => (
            <span
              key={link}
              className={`dsk-nav-link ${link === active ? 'active' : ''}`}
              onClick={() => handleNav(link)}
            >
              {link}
            </span>
          ))}
        </nav>

        <div className="dsk-header-actions">
          {showSearch && (
            <div className="dsk-search">
              <Search size={15} />
              <input
                placeholder="Search events..."
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/guest/feed'); }}
              />
            </div>
          )}

          {loggedIn ? (
            <div
              className="dsk-header-avatar"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/profile'); }}
            >
              {avatarInitials}
            </div>
          ) : (
            <span className="dsk-loglink" onClick={() => navigate('/')}>Sign up</span>
          )}

          <button className="dsk-cta-btn" onClick={() => navigate('/event/step-1')}>
            Start an event
          </button>
        </div>
      </div>
    </header>
  );
}
