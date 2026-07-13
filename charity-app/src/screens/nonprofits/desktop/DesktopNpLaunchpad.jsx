import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flag, MoreHorizontal, QrCode } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import ShareQRModal from '../../../components/ShareQRModal';
import { events, eventDetailPath } from '../../../data/mockData';
import { EventImageBanner } from '../../../components/event/EventImage';

const LIVE_EVENTS = events.map((ev) => ({
  id: ev.id,
  key: ev.key,
  title: ev.title,
  category: ev.category,
  joined: ev.joined,
  backing: ev.backed,
  isLive: ev.isLive,
  cover: ev.cover,
}));

export default function DesktopNpLaunchpad() {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  return (
    <DesktopNpLayout active="home" title="Launchpad">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" className="dsk-live-action-secondary" onClick={() => setShowQR(true)}>
          <QrCode size={14} aria-hidden="true" style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />
          Show my QR
        </button>
      </div>

      <div className="dsk-np-stats-row">
        <div className="dsk-np-stat-card" role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Live events</p>
          <p className="dsk-np-stat-num blue">4</p>
        </div>
        <div className="dsk-np-stat-card" role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Pending approvals</p>
          <p className="dsk-np-stat-num coral">3</p>
        </div>
        <div className="dsk-np-stat-card" role="button" tabIndex={0} onClick={() => navigate('/np/activity')} onKeyDown={onKey(() => navigate('/np/activity'))} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Backers this week</p>
          <p className="dsk-np-stat-num dark">87</p>
        </div>
      </div>

      <div className="dsk-np-panel">
        <div className="dsk-np-panel-head">
          <span className="dsk-np-panel-title">Action required</span>
          <span className="np-count-badge">3 ITEMS</span>
        </div>

        <div className="dsk-np-action-item" role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))}>
          <div className="action-item-icon" style={{ background: 'var(--primary-soft)' }}><Clock size={16} color="var(--primary)" /></div>
          <div className="action-item-body">
            <p className="action-item-title">New event request — Mike Rivera wants to run 'Coastal Cleanup Wave 2'</p>
            <p className="action-item-desc">Submitted 2 hours ago</p>
          </div>
          <span className="np-link-btn">Review →</span>
        </div>
        <div className="dsk-np-action-item" role="button" tabIndex={0} onClick={() => navigate('/np/activity')} onKeyDown={onKey(() => navigate('/np/activity'))}>
          <div className="action-item-icon" style={{ background: 'var(--blue-soft)' }}><Flag size={16} color="var(--blue)" /></div>
          <div className="action-item-body">
            <p className="action-item-title">1 content item flagged — comment in 'Books for Bright Minds'</p>
            <p className="action-item-desc">Automated moderation filter</p>
          </div>
          <span className="np-link-btn">Moderate →</span>
        </div>
      </div>

      <div className="dsk-np-panel-head" style={{ marginTop: 28 }}>
        <span className="dsk-np-panel-title">Your live events</span>
        <button className="np-see-all" onClick={() => navigate('/np/approvals')}>See all →</button>
      </div>
      <div className="dsk-np-event-grid">
        {LIVE_EVENTS.map((ev) => (
          <div
            key={ev.id}
            className="dsk-np-event-card"
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`View ${ev.title}`}
            onClick={() => navigate(eventDetailPath(ev, { loggedIn: false }))}
            onKeyDown={onKey(() => navigate(eventDetailPath(ev, { loggedIn: false })))}
          >
            <EventImageBanner src={ev.cover} alt={ev.title} variant="np-tile" className="dsk-np-event-hero">
              <span className={`badge ${ev.isLive ? 'badge-live' : 'badge-upcoming'}`}>{ev.isLive ? '● LIVE' : 'UPCOMING'}</span>
              <button
                type="button"
                aria-label={`Options for ${ev.title}`}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                onClick={(e) => { e.stopPropagation(); navigate('/live-dashboard'); }}
              >
                <MoreHorizontal size={16} color="white" />
              </button>
            </EventImageBanner>
            <div className="dsk-np-event-body">
              <span className="dsk-np-event-cat">{ev.category}</span>
              <p className="dsk-np-event-title">{ev.title}</p>
              <p className="dsk-np-event-stat">{ev.joined} joined / {ev.backing} backing</p>
            </div>
          </div>
        ))}
      </div>

      <ShareQRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        variant="desktop"
        path="/guest/np/ocean-conservancy"
        title="Scan to view Ocean Conservancy"
        subtitle="Opens our public profile with all live and upcoming events."
      />
    </DesktopNpLayout>
  );
}
