import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Logo from '../Logo';

const NAV_LINKS = ['Discover', 'How it works', 'Causes', 'For nonprofits'];

export default function DesktopHeader({ active = 'Discover', loggedIn = false, avatarInitials = 'SJ' }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleNav = (link) => {
    if (link === 'Discover' || link === 'Causes') navigate('/guest/feed');
    else if (link === 'For nonprofits') navigate('/np/home');
    else showToast('How it works — full walkthrough coming soon');
  };

  return (
    <header className="dsk-header">
      <div className="dsk-header-inner">
        <Logo height={26} tone="dark" onClick={() => navigate('/guest/feed')} style={{ cursor: 'pointer' }} />

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
          <div className="dsk-search">
            <Search size={15} />
            <input
              placeholder="Search events..."
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/guest/feed'); }}
            />
          </div>

          {loggedIn ? (
            <div className="dsk-header-avatar">{avatarInitials}</div>
          ) : (
            <span className="dsk-loglink" onClick={() => navigate('/')}>Log in</span>
          )}

          <button className="dsk-cta-btn" onClick={() => navigate('/event/step-1')}>
            Start an event
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '12px 18px',
            borderRadius: 999, fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200, whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </header>
  );
}
