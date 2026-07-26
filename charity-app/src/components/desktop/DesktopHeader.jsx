import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../auth/AuthContext';
import { resetDraft } from '../../hooks/useCreateEventDraft';

const NAV_LINKS = ['Discover', 'How it works', 'Causes', 'For nonprofits'];

/**
 * Global desktop chrome. Auth state is read from AuthContext so authenticated
 * users never see "Sign up" — callers no longer need to remember loggedIn.
 * Optional props still override initials / home path when needed.
 */
export default function DesktopHeader({
  active = 'Discover',
  loggedIn: loggedInProp,
  avatarInitials,
  homePath,
  showSearch = true,
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const loggedIn = isAuthenticated || !!loggedInProp;
  const initials = avatarInitials || user?.initials || 'SE';
  const resolvedHome = homePath || (loggedIn ? '/feed' : '/guest/feed');

  const handleNav = (link) => {
    if (link === 'Discover') {
      navigate(resolvedHome);
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
    if (!loggedIn) {
      navigate('/');
      return;
    }
    resetDraft();
    navigate('/event/step-1');
  };

  return (
    <header className="dsk-header">
      <div className="dsk-header-inner">
        <Logo height={26} tone="dark" style={{ cursor: 'pointer' }} onClick={() => navigate(resolvedHome)} />

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
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(resolvedHome); }}
              />
            </div>
          )}

          {loggedIn ? (
            <>
              <button
                type="button"
                className="dsk-loglink"
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                onClick={() => navigate('/event/drafts')}
              >
                Your drafts
              </button>
              <div
                className="dsk-header-avatar"
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/profile'); }}
              >
                {initials}
              </div>
            </>
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
