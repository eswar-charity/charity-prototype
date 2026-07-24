import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MoreHorizontal, QrCode } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import ShareQRModal from '../../../components/ShareQRModal';
import { eventDetailPath } from '../../../utils/eventPaths';
import { EventImageBanner } from '../../../components/event/EventImage';
import { useNpLaunchpad } from '../../../hooks/useNpDashboard';

export default function DesktopNpLaunchpad() {
  const navigate = useNavigate();
  const { data, loading, error } = useNpLaunchpad();
  const [showQR, setShowQR] = useState(false);
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const org = data?.org;
  const stats = data?.stats ?? {};
  const liveEvents = data?.liveEvents ?? [];
  const actionRequired = data?.actionRequired ?? [];
  const orgName = org?.name ?? 'Your organization';
  const orgSlug = org?.slug ?? 'profile';

  if (loading) {
    return (
      <DesktopNpLayout active="home" title="Launchpad">
        <p style={{ color: 'var(--text-secondary)' }}>Loading launchpad…</p>
      </DesktopNpLayout>
    );
  }

  if (error || !data) {
    return (
      <DesktopNpLayout active="home" title="Launchpad">
        <p style={{ color: 'var(--text-secondary)' }}>{error?.message || 'Could not load launchpad'}</p>
      </DesktopNpLayout>
    );
  }

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
          <p className="dsk-np-stat-num blue">{stats.live_events ?? 0}</p>
        </div>
        <div className="dsk-np-stat-card" role="button" tabIndex={0} onClick={() => navigate('/np/approvals')} onKeyDown={onKey(() => navigate('/np/approvals'))} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Pending approvals</p>
          <p className="dsk-np-stat-num coral">{stats.pending_approvals ?? 0}</p>
        </div>
        <div className="dsk-np-stat-card" role="button" tabIndex={0} onClick={() => navigate('/np/activity')} onKeyDown={onKey(() => navigate('/np/activity'))} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Backers this week</p>
          <p className="dsk-np-stat-num dark">{stats.backers ?? 0}</p>
        </div>
      </div>

      <div className="dsk-np-panel">
        <div className="dsk-np-panel-head">
          <span className="dsk-np-panel-title">Action required</span>
          {actionRequired.length > 0 && (
            <span className="np-count-badge">{actionRequired.length} ITEM{actionRequired.length === 1 ? '' : 'S'}</span>
          )}
        </div>

        {actionRequired.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nothing pending right now.</p>
        ) : (
          actionRequired.map((item) => (
            <div
              key={item.id}
              className="dsk-np-action-item"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/np/approvals')}
              onKeyDown={onKey(() => navigate('/np/approvals'))}
            >
              <div className="action-item-icon" style={{ background: 'var(--primary-soft)' }}><Clock size={16} color="var(--primary)" /></div>
              <div className="action-item-body">
                <p className="action-item-title">New event request — {item.title}</p>
                <p className="action-item-desc">{item.status ?? 'Pending review'}</p>
              </div>
              <span className="np-link-btn">Review →</span>
            </div>
          ))
        )}
      </div>

      <div className="dsk-np-panel-head" style={{ marginTop: 28 }}>
        <span className="dsk-np-panel-title">Your live events</span>
        {liveEvents.length > 0 && (
          <button className="np-see-all" onClick={() => navigate('/np/approvals')}>See all →</button>
        )}
      </div>
      {liveEvents.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No live events yet.</p>
      ) : (
        <div className="dsk-np-event-grid">
          {liveEvents.map((ev) => (
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
                {ev.category && <span className="dsk-np-event-cat">{ev.category}</span>}
                <p className="dsk-np-event-title">{ev.title}</p>
                <p className="dsk-np-event-stat">{ev.joined} joined / {ev.backed} backing</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareQRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        variant="desktop"
        path={`/guest/np/${orgSlug}`}
        title={`Scan to view ${orgName}`}
        subtitle="Opens our public profile with all live and upcoming events."
      />
    </DesktopNpLayout>
  );
}
