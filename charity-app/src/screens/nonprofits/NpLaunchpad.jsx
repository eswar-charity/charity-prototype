import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flag, MoreHorizontal, QrCode } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import NotificationBell, { NP_NOTIFICATIONS } from '../../components/NotificationBell';
import MobileAppHeader from '../../components/MobileAppHeader';
import ShareQRModal from '../../components/ShareQRModal';
import { events } from '../../data/mockData';

const ORG_LOGO = '/events/breakneck-ridge-run/img1.jpg';
const HEADER_AVATAR = '/events/give-now/img2.jpg';

const LIVE_EVENTS = events.map((ev) => ({
  id: ev.id,
  title: ev.title,
  stat: `${ev.joined} joined`,
  isLive: ev.isLive,
  cover: ev.cover,
}));

export default function NpLaunchpad() {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            homePath="/np/home"
            title="Launchpad"
            actions={(
              <>
                <NotificationBell items={NP_NOTIFICATIONS} />
                <button
                  type="button"
                  className="np-header-avatar"
                  onClick={() => navigate('/np/profile')}
                  aria-label="View profile"
                >
                  <img src={HEADER_AVATAR} alt="Ocean Conservancy" />
                </button>
              </>
            )}
          />

          <div style={{ padding: '0 18px 8px' }}>
            {/* Org card */}
            <div className="card np-org-card">
              <div className="np-org-row">
                <img className="np-org-logo" src={ORG_LOGO} alt="Ocean Conservancy" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Ocean Conservancy</p>
                  <span className="np-verified-badge">✓ Verified 501(c)(3) · Active</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <button
                  type="button"
                  className="np-link-btn"
                  onClick={() => navigate('/np/profile')}
                >
                  View profile →
                </button>
                <button
                  type="button"
                  className="np-link-btn"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode size={13} aria-hidden="true" style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                  Show my QR
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="np-stats-row">
              <div className="np-stat" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))}>
                <div className="np-stat-num blue">4</div>
                <div className="np-stat-lbl">Live Events</div>
              </div>
              <div className="np-stat" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))}>
                <div className="np-stat-num coral">3</div>
                <div className="np-stat-lbl">Pending Approvals</div>
              </div>
              <div className="np-stat" style={{ cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => navigate('/np/activity')} onKeyDown={onKey(() => navigate('/np/activity'))}>
                <div className="np-stat-num dark">87</div>
                <div className="np-stat-lbl">Backers This Week</div>
              </div>
            </div>

            {/* Action required */}
            <div className="np-section-header">
              <div className="np-section-title-row">
                <p className="np-section-title">Action required</p>
                <span className="np-count-badge">3 ITEMS</span>
              </div>
              <button type="button" className="np-see-all" onClick={() => navigate('/np/approvals')}>
                See all
              </button>
            </div>

            <div className="action-item coral-border" role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))}>
              <div className="action-item-icon" style={{ background: 'var(--primary-soft)' }}>
                <Clock size={16} color="var(--primary)" />
              </div>
              <div className="action-item-body">
                <p className="action-item-title">New event request</p>
                <p className="action-item-desc">Mike Rivera wants to run &apos;Coastal Cleanup Wave 2&apos;</p>
                <span className="np-link-btn">Review →</span>
              </div>
            </div>

            <div className="action-item blue-border" role="button" tabIndex={0} onClick={() => navigate('/np/activity')} onKeyDown={onKey(() => navigate('/np/activity'))}>
              <div className="action-item-icon" style={{ background: 'var(--blue-soft)' }}>
                <Flag size={16} color="var(--blue)" />
              </div>
              <div className="action-item-body">
                <p className="action-item-title">1 content item flagged</p>
                <p className="action-item-desc">Comment reported in &apos;Books for Bright Minds&apos;</p>
                <span className="np-link-btn">Moderate →</span>
              </div>
            </div>

            {/* Live events */}
            <div className="np-section-header" style={{ marginTop: 8 }}>
              <p className="np-section-title">Your live events</p>
              <button type="button" className="np-see-all" onClick={() => navigate('/np/approvals')}>
                See all
              </button>
            </div>

            <div className="lp-event-scroll">
              {LIVE_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="lp-event-card"
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${ev.title}`}
                  onClick={() => navigate(ev.isLive ? '/guest/event/live' : '/guest/event/upcoming')}
                  onKeyDown={onKey(() => navigate(ev.isLive ? '/guest/event/live' : '/guest/event/upcoming'))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className={`badge ${ev.isLive ? 'badge-live' : 'badge-upcoming'}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)' }}>
                      {ev.isLive ? '● LIVE' : 'UPCOMING'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Options for ${ev.title}`}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                      onClick={(e) => { e.stopPropagation(); navigate('/live-dashboard'); }}
                    >
                      <MoreHorizontal size={16} color="var(--text-light)" />
                    </button>
                  </div>
                  <div style={{ height: 70, borderRadius: 8, backgroundImage: `url(${ev.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 10, backgroundColor: 'var(--border)' }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{ev.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.stat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <NpBottomNav active="home" />
      </div>

      <ShareQRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        variant="mobile"
        path="/guest/np/ocean-conservancy"
        title="Scan to view Ocean Conservancy"
        subtitle="Opens our public profile with all live and upcoming events."
      />
    </div>
  );
}
