import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, TriangleAlert, Pencil, X, ScanLine, QrCode } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import QRScannerModal from '../../components/QRScannerModal';
import ShareQRModal from '../../components/ShareQRModal';
import { eventDisplayTitle } from '../../data/mockData';
import { EventImage, EventImageBanner } from '../../components/event/EventImage';
import { useSeLiveDashboard } from '../../hooks/useSeDashboard';

export default function DesktopLiveDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, postPending, submitUpdate } = useSeLiveDashboard();
  const [toast, setToast] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
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
      setPostOpen(false);
      setUpdate('');
      showToast('Update posted to your event');
    } catch (err) {
      showToast(err?.message || 'Could not post update');
    }
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
            {error?.message || 'Could not load live dashboard'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" />

      <main className="dsk-main">
        <div className="dsk-container dsk-live-dashboard-wrap">
          <div className="dsk-live-dashboard-head">
            <div>
              <p className="dsk-live-dashboard-eyebrow">Organiser dashboard</p>
              <h1 className="dsk-live-dashboard-title">My Event</h1>
            </div>
            <button
              type="button"
              className="dsk-live-dashboard-settings"
              onClick={() => navigate('/profile')}
              aria-label="Event settings"
            >
              <Settings size={18} />
            </button>
          </div>

          {showAlert && (
            <div className="dsk-live-alert">
              <TriangleAlert size={18} color="var(--primary)" />
              <div className="dsk-live-alert-copy">
                <p>1 comment flagged for review.</p>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ marginTop: 4, fontSize: 13, padding: 0 }}
                  onClick={() => {
                    setShowAlert(false);
                    showToast('Comment reviewed');
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          )}

          <div className="dsk-live-dashboard-grid">
            <div className="dsk-live-dashboard-main">
              <div className="dsk-live-event-card">
                <EventImageBanner src={ev.cover} alt={ev.title} variant="preview" className="dsk-live-event-thumb" />
                <div className="dsk-live-event-copy">
                  <p className="dsk-live-event-title">{eventDisplayTitle(ev.title)}</p>
                  <p className="dsk-live-event-sub">{ev.nonprofit} · {ev.location}</p>
                  <span className="dsk-live-pill"><span className="live-dot" /> LIVE NOW</span>
                </div>
              </div>

              <div className="dsk-live-stats">
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

              <div className="dsk-live-actions">
                <button type="button" className="dsk-cta-btn dsk-live-action-scan" onClick={() => setShowScanner(true)}>
                  <ScanLine size={16} aria-hidden="true" />
                  Scan check-in
                </button>
                <button type="button" className="dsk-cta-btn" onClick={() => setPostOpen(true)}>
                  Post update
                </button>
                <button type="button" className="dsk-live-action-secondary" onClick={() => showToast('Photo added to your event')}>
                  Add photo
                </button>
                <button type="button" className="dsk-live-action-secondary" onClick={() => setShowShare(true)}>
                  Share event
                </button>
                <button type="button" className="dsk-live-action-secondary" onClick={() => setShowQR(true)}>
                  <QrCode size={14} aria-hidden="true" style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />
                  Show event QR
                </button>
                <button type="button" className="dsk-live-action-secondary" onClick={() => navigate('/event/live')}>
                  View public page
                </button>
              </div>
            </div>

            <aside className="dsk-live-activity-panel">
              <div className="dsk-panel-head">
                <span className="dsk-panel-title">Live activity</span>
                <span className="dsk-live-pill dsk-live-pill--compact"><span className="live-dot" /> Streaming</span>
              </div>

              <div className="dsk-live-activity-list">
                {activities.map((act) => (
                  <div key={act.id} className="dsk-activity-item">
                    <div className="dsk-activity-avatar" style={{ background: act.color }}>{act.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {act.type === 'join' && (
                        <p className="dsk-activity-highlight">{act.text}</p>
                      )}
                      {act.type === 'update' && (
                        <>
                          <div className="dsk-activity-header">
                            <span>
                              {act.user}
                              {act.isOrganizer && <Pencil size={12} color="var(--blue)" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
                            </span>
                            <span className="dsk-activity-time">{act.time}</span>
                          </div>
                          <p className="dsk-activity-text">{act.text}</p>
                          {act.image && (
                            <div className="event-img-frame event-img-frame--activity-lg dsk-live-activity-image">
                              <EventImage src={act.image} alt={`Photo by ${act.user}`} fill />
                            </div>
                          )}
                        </>
                      )}
                      {act.type === 'org' && (
                        <>
                          <div className="dsk-activity-header">
                            <span>
                              {act.user}
                              {act.isVerified && <span className="dsk-verify-dot">✓</span>}
                            </span>
                            <span className="dsk-activity-time">{act.time}</span>
                          </div>
                          <p className="dsk-activity-text">{act.text}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <DesktopFooter />

      {postOpen && (
        <div className="dsk-modal-backdrop" onClick={() => setPostOpen(false)} role="presentation">
          <div className="dsk-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Post an update">
            <div className="dsk-modal-head">
              <h3>Post an update</h3>
              <button type="button" className="dsk-modal-close" onClick={() => setPostOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <textarea
              className="input-field"
              placeholder="Share what's happening with your supporters…"
              value={update}
              onChange={(e) => setUpdate(e.target.value)}
              style={{ minHeight: 120, marginBottom: 14 }}
            />
            <button
              type="button"
              className="dsk-cta-btn"
              style={{ width: '100%' }}
              onClick={postUpdate}
              disabled={!update.trim() || postPending}
            >
              {postPending ? 'Posting…' : 'Post update'}
            </button>
          </div>
        </div>
      )}

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={`https://charityhub.app/e/${ev.key}`}
          title={eventDisplayTitle(ev.title)}
          subtitle={`${ev.nonprofit} · verified`}
        />
      )}

      <QRScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        role="se"
        variant="desktop"
        eventTitle={eventDisplayTitle(ev.title)}
        onScanSuccess={(attendee) => {
          setJoinedCount((c) => (c ?? joined) + 1);
          showToast(`${attendee.name} checked in`);
        }}
      />

      <ShareQRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        variant="desktop"
        path="/guest/event/live"
        title={`Scan to join ${eventDisplayTitle(ev.title)}`}
        subtitle="Guests land straight on the event page to join and back it."
      />

      {toast && <div className="dsk-live-toast">{toast}</div>}
    </div>
  );
}
