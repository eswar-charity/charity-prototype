import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User, Settings, Pencil, X, ScanLine, QrCode } from 'lucide-react';
import { eventDisplayTitle } from '../utils/eventDisplay';
import { EventImage, EventImageBanner } from '../components/event/EventImage';
import MobileAppHeader from '../components/MobileAppHeader';
import MobileShareModal from '../components/MobileShareModal';
import QRScannerModal from '../components/QRScannerModal';
import ShareQRModal from '../components/ShareQRModal';
import { useSeLiveDashboard } from '../hooks/useSeDashboard';
import { buildAppUrl } from '../utils/qrLink';
import { eventLivePath } from '../utils/eventPaths';

export default function LiveDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, postPending, submitUpdate } = useSeLiveDashboard();
  const [toast, setToast] = useState('');
  const [postSheet, setPostSheet] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [joinedCount, setJoinedCount] = useState(null);
  const [update, setUpdate] = useState('');

  const ev = data?.event;
  const stats = data?.stats ?? {};
  const activities = data?.activities ?? [];
  const joined = joinedCount ?? stats.joined ?? 0;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const postUpdate = async () => {
    const text = update.trim();
    if (!text) return;
    try {
      await submitUpdate(text);
      setPostSheet(false);
      setUpdate('');
      showToast('Update posted to your event');
    } catch (err) {
      showToast(err?.message || 'Could not post update');
    }
  };

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load live dashboard'}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '0 18px 0' }}>
          <MobileAppHeader
            homePath="/feed"
            title="My Event"
            actions={(
              <button
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Settings"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <Settings size={20} color="var(--text-secondary)" />
              </button>
            )}
          />
          <div style={{ paddingTop: 4 }}>

          <div className="event-card-row" style={{ marginBottom: 16 }}>
            <EventImageBanner
              src={ev.cover}
              alt={ev.title}
              variant="preview"
              className="recent-thumb"
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{eventDisplayTitle(ev.title)}</p>
              <div className="live-badge" style={{ marginTop: 4 }}>
                <div className="live-dot" />
                LIVE NOW
              </div>
            </div>
          </div>

          <div className="stat-row" style={{ marginBottom: 16 }}>
            <div className="stat-box">
              <div className="stat-num">{joined}</div>
              <div className="stat-lbl">Joined</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{stats.backed ?? 0}</div>
              <div className="stat-lbl">Backing</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{stats.updates ?? 0}</div>
              <div className="stat-lbl">Updates</div>
            </div>
          </div>

          <div className="action-chips" style={{ marginBottom: 20 }}>
            <button type="button" className="action-chip action-chip--scan" onClick={() => setShowScanner(true)}>
              <ScanLine size={14} aria-hidden="true" />
              Scan check-in
            </button>
            <button className="action-chip" onClick={() => setPostSheet(true)}>Post update</button>
            <button className="action-chip" onClick={() => showToast('Photo added to your event')}>Add photo</button>
            <button className="action-chip" onClick={() => setShowShare(true)}>Share event</button>
            <button type="button" className="action-chip action-chip--scan" onClick={() => setShowQR(true)}>
              <QrCode size={14} aria-hidden="true" />
              Show event QR
            </button>
          </div>

          <div className="section-header">
            <p className="section-title">Live activity</p>
          </div>

          {activities.map((act) => (
            <div key={act.id} className="activity-item">
              <div className="act-avatar" style={{ background: act.color }}>
                {act.initials}
              </div>
              <div style={{ flex: 1 }}>
                {act.type === 'join' && (
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                    {act.text}
                  </p>
                )}
                {act.type === 'update' && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                      {act.user}
                      {act.isOrganizer && (
                        <Pencil size={12} color="var(--blue)" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                      )}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5, marginBottom: act.image ? 8 : 0 }}>
                      {act.text}
                    </p>
                    {act.image && (
                      <div className="event-img-frame event-img-frame--activity">
                        <EventImage src={act.image} alt={`Photo by ${act.user}`} fill />
                      </div>
                    )}
                  </>
                )}
                {act.type === 'org' && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                      {act.user}{' '}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'var(--blue)',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        justifyContent: 'center',
                        verticalAlign: 'middle',
                      }}>✓</span>
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>
                      {act.text}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => navigate('/live-dashboard')}>
            <Home size={22} />
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/feed')}>
            <Compass size={22} />
            <span>Explore</span>
          </button>
          <button className="nav-center-btn" aria-label="Create event" onClick={() => navigate('/create-event')}>
            <Plus size={24} />
          </button>
          <button className="nav-item" onClick={() => navigate(ev.key ? `/post-event?key=${encodeURIComponent(ev.key)}` : '/post-event')}>
            <Bell size={22} />
            <span>Activity</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/feed')}>
            <User size={22} />
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {postSheet && (
        <div className="overlay-bg" onClick={() => setPostSheet(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>Post an update</p>
              <button
                onClick={() => setPostSheet(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>
            <textarea
              className="input-field"
              aria-label="Write an update to your supporters"
              placeholder="Share what's happening with your supporters…"
              value={update}
              onChange={(e) => setUpdate(e.target.value)}
              style={{ minHeight: 110, marginBottom: 14 }}
            />
            <button
              className="btn-primary"
              onClick={postUpdate}
              disabled={!update.trim() || postPending}
              style={update.trim() && !postPending ? undefined : { opacity: 0.5 }}
            >
              {postPending ? 'Posting…' : 'Post update'}
            </button>
          </div>
        </div>
      )}

      {showShare && (
        <MobileShareModal
          title={eventDisplayTitle(ev.title)}
          subtitle={`${ev.nonprofit} · verified`}
          url={buildAppUrl(eventLivePath(ev.key))}
          onClose={() => setShowShare(false)}
        />
      )}

      <QRScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        role="se"
        eventId={ev.id}
        variant="mobile"
        eventTitle={eventDisplayTitle(ev.title)}
        onScanSuccess={(attendee) => {
          setJoinedCount((c) => (c ?? joined) + 1);
          showToast(`${attendee.name} checked in`);
        }}
      />

      <ShareQRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        variant="mobile"
        path="/guest/event/live"
        title={`Scan to join ${eventDisplayTitle(ev.title)}`}
        subtitle="Guests land straight on the event page to join and back it."
      />

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
