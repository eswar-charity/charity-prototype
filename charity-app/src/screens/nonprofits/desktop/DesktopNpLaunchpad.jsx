import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Flag, MoreHorizontal } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

const LIVE_EVENTS = [
  { id: 1, title: 'Coastal Cleanup Wave 1', category: 'Community', joined: 87, backing: 150, isLive: true, cover: '/events/breakneck-ridge-run/img1.jpg' },
  { id: 2, title: 'Books for Bright Minds Gala', category: 'Education', joined: 42, backing: 100, isLive: false, cover: '/events/give-now/img1.jpg' },
  { id: 3, title: 'Urban Oasis Seed Drive', category: 'Environment', joined: 215, backing: 300, isLive: true, cover: '/events/dog-dad/img5.png' },
];

export default function DesktopNpLaunchpad() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  return (
    <DesktopNpLayout active="home" title="Launchpad">
      <div className="dsk-np-stats-row">
        <div className="dsk-np-stat-card" onClick={() => navigate('/np/approvals')} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Live events</p>
          <p className="dsk-np-stat-num blue">4</p>
        </div>
        <div className="dsk-np-stat-card" onClick={() => navigate('/np/approvals')} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Pending approvals</p>
          <p className="dsk-np-stat-num coral">3</p>
        </div>
        <div className="dsk-np-stat-card" onClick={() => navigate('/np/activity')} style={{ cursor: 'pointer' }}>
          <p className="dsk-np-stat-lbl">Backers this week</p>
          <p className="dsk-np-stat-num dark">87</p>
        </div>
      </div>

      <div className="dsk-np-panel">
        <div className="dsk-np-panel-head">
          <span className="dsk-np-panel-title">Action required</span>
          <span className="np-count-badge">3 ITEMS</span>
        </div>

        <div className="dsk-np-action-item" onClick={() => navigate('/np/approvals')}>
          <div className="action-item-icon" style={{ background: 'var(--primary-soft)' }}><Clock size={16} color="var(--primary)" /></div>
          <div className="action-item-body">
            <p className="action-item-title">New event request — Maya R. wants to run 'Coastal Cleanup Wave 2'</p>
            <p className="action-item-desc">Submitted 2 hours ago</p>
          </div>
          <span className="np-link-btn">Review →</span>
        </div>
        <div className="dsk-np-action-item" onClick={() => navigate('/np/activity')}>
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
          <div key={ev.id} className="dsk-np-event-card" onClick={() => notify(`Manage “${ev.title}” — coming soon`)}>
            <div className="dsk-np-event-hero" style={{ backgroundImage: `url(${ev.cover})` }}>
              <span className={`badge ${ev.isLive ? 'badge-live' : 'badge-upcoming'}`}>{ev.isLive ? '● LIVE' : 'UPCOMING'}</span>
              <button
                type="button"
                aria-label={`Options for ${ev.title}`}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                onClick={(e) => { e.stopPropagation(); notify(`Options for “${ev.title}”`); }}
              >
                <MoreHorizontal size={16} color="white" />
              </button>
            </div>
            <div className="dsk-np-event-body">
              <span className="dsk-np-event-cat">{ev.category}</span>
              <p className="dsk-np-event-title">{ev.title}</p>
              <p className="dsk-np-event-stat">{ev.joined} joined / {ev.backing} backing</p>
            </div>
          </div>
        ))}
      </div>
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
