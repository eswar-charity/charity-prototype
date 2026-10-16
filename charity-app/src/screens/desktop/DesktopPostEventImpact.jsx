import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, ChevronRight, Rocket, Users, Award } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import Logo from '../../components/Logo';
import { eventDisplayTitle } from '../../utils/eventDisplay';
import { useAuth } from '../../auth/AuthContext';
import { useSePostEvent } from '../../hooks/useSeDashboard';
import { buildAppUrl } from '../../utils/qrLink';
import { eventLivePath } from '../../utils/eventPaths';

function initialsFrom(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DesktopPostEventImpact() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useSePostEvent();
  const [toast, setToast] = useState('');
  const [showShare, setShowShare] = useState(false);

  const ev = data?.event;
  const impact = data?.impact ?? {};
  const organizerName = user?.name ?? 'Organizer';
  const organizerInitials = user?.initials ?? initialsFrom(user?.name);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  if (loading) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn homePath="/feed" />
        <main className="dsk-main"><div className="dsk-container" style={{ padding: 48, textAlign: 'center' }}>Loading…</div></main>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn homePath="/feed" />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            {error?.message || 'Could not load impact recap'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" />

      <main className="dsk-main">
        <div className="dsk-container dsk-post-event-wrap">
          <div className="dsk-post-event-head">
            <p className="dsk-post-event-eyebrow">You made this happen</p>
            <h1 className="dsk-post-event-title">{eventDisplayTitle(ev.title)}</h1>
            <p className="dsk-post-event-subtitle">{ev.date} · {ev.nonprofit}</p>
          </div>

          <div className="dsk-post-event-stats">
            <div className="stat-box">
              <div className="stat-num">{impact.backers ?? 0}</div>
              <div className="stat-lbl">People backed</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{impact.participants ?? 0}</div>
              <div className="stat-lbl">Joined in person</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{impact.updates ?? 0}</div>
              <div className="stat-lbl">Live updates</div>
            </div>
          </div>

          <div className="dsk-post-event-grid">
            <div className="credential-card dsk-post-event-credential">
              <div className="dsk-post-event-credential-brand">
                <Logo height={22} />
                <span className="dsk-post-event-credential-badge">OFFICIAL EVENT ORGANISER</span>
              </div>

              <div className="dsk-post-event-credential-user">
                <div className="dsk-post-event-credential-avatar">{organizerInitials}</div>
                <div>
                  <p className="dsk-post-event-credential-name">{organizerName}</p>
                  <p className="dsk-post-event-credential-event">{eventDisplayTitle(ev.title)}</p>
                </div>
              </div>

              <p className="dsk-post-event-credential-meta">{impact.backers ?? 0} participants · {ev.nonprofit} · {ev.date}</p>

              <div className="dsk-post-event-credential-actions">
                <button type="button" className="dsk-post-event-share-btn" onClick={() => setShowShare(true)}>
                  Share your impact <Share2 size={15} />
                </button>
                <button
                  type="button"
                  className="dsk-post-event-settings-btn"
                  onClick={() => navigate('/profile')}
                  aria-label="Credential settings"
                >
                  <Settings size={16} color="var(--primary)" />
                </button>
              </div>
            </div>

            <div className="dsk-post-event-side">
              <div className="card dsk-post-event-thanks">
                <div className="dsk-post-event-thanks-icon"><Award size={24} color="var(--primary)" /></div>
                <div>
                  <p className="dsk-post-event-thanks-title">
                    Thank you, {organizerName.split(' ')[0]}! <span className="dsk-verify-dot">✓</span>
                  </p>
                  <p className="dsk-post-event-thanks-text">
                    Your event brought real people to this cause. We&apos;re grateful.
                  </p>
                </div>
              </div>

              <div className="dsk-post-event-next">
                <p className="dsk-post-event-next-title">Keep the momentum going</p>

                <button type="button" className="keep-row" onClick={() => navigate('/event/step-1')}>
                  <div className="keep-icon-circle" style={{ background: 'var(--primary-soft)' }}>
                    <Rocket size={20} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Create your next event</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </button>

                <button type="button" className="keep-row" onClick={() => navigate('/feed')}>
                  <div className="keep-icon-circle" style={{ background: 'var(--blue-soft)' }}>
                    <Users size={20} color="var(--blue)" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Explore other events</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DesktopFooter />

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={buildAppUrl(eventLivePath(ev.key))}
          title={`${eventDisplayTitle(ev.title)} — Impact Recap`}
          subtitle={`${impact.backers ?? 0} participants · ${ev.nonprofit}`}
        />
      )}

      {toast && (
        <div className="dsk-post-event-toast">{toast}</div>
      )}
    </div>
  );
}
