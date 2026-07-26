import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, MapPin, ChevronRight, Share2, LogOut } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import MobileAppHeader from '../components/MobileAppHeader';
import MobileShareModal from '../components/MobileShareModal';
import { useAuth } from '../auth/AuthContext';
import { eventDetailPath } from '../utils/eventPaths';
import { EventImageBanner } from '../components/event/EventImage';
import { useSeProfile } from '../hooks/useSeProfile';
import { initialsFromName } from '../utils/initials';

const DEFAULT_BIO = 'Creating events that bring communities together for causes that matter.';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { profile, hostedEvents, stats, loading, error, reload } = useSeProfile();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  const name = profile?.name ?? 'Profile';
  const initials = initialsFromName(name, profile?.initials ?? '?');
  const city = profile?.city;
  const bio = profile?.bio || DEFAULT_BIO;

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            homePath="/feed"
            title="Profile"
            actions={(
              <button
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'white', border: 'none', boxShadow: 'var(--card-shadow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                aria-label="Share profile"
                onClick={() => setShowShare(true)}
              >
                <Share2 size={18} color="var(--dark)" />
              </button>
            )}
          />
          <div style={{ padding: '0 18px 24px' }}>
            {loading && (
              <div className="feed-loader"><span className="feed-spinner" /> Loading profile…</div>
            )}
            {error && !profile && (
              <div className="discovery-empty" role="alert">
                <p className="discovery-empty-title">Couldn&apos;t load profile</p>
                <p className="discovery-empty-copy">{error.message || 'Something went wrong.'}</p>
                <button type="button" className="guest-signup-btn" style={{ marginTop: 12 }} onClick={reload}>
                  Try again
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: 'auto', margin: '12px auto 0', padding: '10px 20px', fontSize: 14, display: 'flex' }}
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOut size={14} /> {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
            {profile && (
              <>
            <div className="card" style={{ textAlign: 'center', padding: '24px 18px 20px', marginBottom: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--primary),var(--blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: 'white',
                margin: '0 auto 12px',
              }}>{initials}</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>{name}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Social Entrepreneur</p>
              {city && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                  <MapPin size={13} color="var(--text-secondary)" />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{city}</span>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                {bio}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}
                  onClick={() => navigate('/about-you')}
                >
                  <Pencil size={14} /> Edit profile
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOut size={14} /> {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>

            <div className="stat-row" style={{ marginBottom: 20 }}>
              <div className="stat-box">
                <div className="stat-num">{stats.eventsHosted}</div>
                <div className="stat-lbl">Events hosted</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{stats.peopleReached}</div>
                <div className="stat-lbl">People reached</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">${Math.round(stats.raised / 1000)}k</div>
                <div className="stat-lbl">Raised</div>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Your events</p>
            <div
              className="card"
              style={{ marginBottom: 12, padding: 0 }}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/event/drafts')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/event/drafts');
                }
              }}
            >
              <div className="recent-event-row">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Draft events</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Continue editing or submit for approval</p>
                </div>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              {hostedEvents.length === 0 && (
                <p style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No events yet — create your first event from the feed.
                </p>
              )}
              {hostedEvents.map((ev) => (
                <div
                  key={ev.id ?? ev.key}
                  className="recent-event-row"
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${ev.title}`}
                  onClick={() => navigate(eventDetailPath(ev, { loggedIn: true }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(eventDetailPath(ev, { loggedIn: true }));
                    }
                  }}
                >
                  <EventImageBanner src={ev.cover} alt={ev.title} variant="preview" className="recent-thumb" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{ev.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.nonprofit} · {ev.backed} backing</p>
                  </div>
                  <ChevronRight size={16} color="var(--text-light)" />
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        </div>

        <BottomNav active="profile" onPlusClick={() => navigate('/create-event')} />
      </div>

      {showShare && (
        <MobileShareModal
          title={name}
          subtitle="Event Presenter · Charity Hub"
          url={`${window.location.origin}/profile`}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
