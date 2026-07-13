import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Logo from '../Logo';

const NAV_LINKS = ['Discover', 'How it works', 'Causes', 'For nonprofits'];

export default function DesktopHeader({ active = 'Discover', loggedIn = false, avatarInitials = 'MR', homePath = '/guest/feed', showSearch = true }) {
  const navigate = useNavigate();

  const handleNav = (link) => {
    if (link === 'Discover') {
      navigate(homePath);
      return;
    }
    if (link === 'Causes') {
      navigate('/causes');
      return;
    }
    if (link === 'How it works') {
      navigate('/how-it-works');
      return;
    }
    if (link === 'For nonprofits') {
      navigate('/np/home');
      return;
    }
  };

  const handleStartEvent = () => {
    navigate(loggedIn ? '/event/step-1' : '/');
  };

  return (
    <header className="dsk-header">
      <div className="dsk-header-inner">
        <Logo height={26} tone="dark" style={{ cursor: 'pointer' }} />

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

          <button className="dsk-cta-btn" onClick={handleStartEvent}>
            Start an event
          </button>
        </div>
      </div>
    </header>
  );
}
