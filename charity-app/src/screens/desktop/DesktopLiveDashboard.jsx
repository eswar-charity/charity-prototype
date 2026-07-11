import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, TriangleAlert, Pencil, X, ScanLine } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import QRScannerModal from '../../components/QRScannerModal';
import { events, liveActivities } from '../../data/mockData';

const ev = events[0];

export default function DesktopLiveDashboard() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [joinedCount, setJoinedCount] = useState(ev.joined);
  const [update, setUpdate] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const postUpdate = () => {
    setPostOpen(false);
    setUpdate('');
    showToast('Update posted to your event');
  };

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
                <div
                  className="dsk-live-event-thumb"
                  style={{ backgroundImage: `url(${ev.photos[0]})` }}
                />
                <div className="dsk-live-event-copy">
                  <p className="dsk-live-event-title">{ev.title}</p>
                  <p className="dsk-live-event-sub">{ev.nonprofit} · {ev.location}</p>
                  <span className="dsk-live-pill"><span className="live-dot" /> LIVE NOW</span>
                </div>
              </div>

              <div className="dsk-live-stats">
                <div className="stat-box">
                  <div className="stat-num">{joinedCount}</div>
                  <div className="stat-lbl">Joined</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{ev.backed}</div>
                  <div className="stat-lbl">Backing</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{ev.updates}</div>
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
                {liveActivities.map((act) => (
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
                            <div
                              className="dsk-live-activity-image"
                              style={{ backgroundImage: `url(${act.image})` }}
                            />
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
              disabled={!update.trim()}
            >
              Post update
            </button>
          </div>
        </div>
      )}

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url="https://charityhub.app/e/neon-night-run"
          title={`#${ev.title.replace(/\s+/g, '')}`}
          subtitle={`${ev.nonprofit} · verified`}
        />
      )}

      <QRScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        role="se"
        variant="desktop"
        eventTitle={ev.title}
        onScanSuccess={(attendee) => {
          setJoinedCount((c) => c + 1);
          showToast(`${attendee.name} checked in`);
        }}
      />

      {toast && <div className="dsk-live-toast">{toast}</div>}
    </div>
  );
}
