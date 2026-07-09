import { useState } from 'react';
import { Check } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

const BACKING_BY_EVENT = [
  { id: 1, title: 'Coastal Cleanup Drive', count: 87, thumb: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop' },
  { id: 2, title: 'Books for Bright Minds', count: 42, thumb: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop' },
  { id: 3, title: 'Plant a Tree', count: 28, thumb: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=100&h=100&fit=crop' },
];

export default function DesktopNpActivity() {
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  return (
    <DesktopNpLayout active="activity" title="Activity">
      <div className="dsk-np-stats-row">
        <div className="dsk-np-stat-card">
          <p className="dsk-np-stat-num dark" style={{ fontSize: 34 }}>47</p>
          <p className="dsk-np-stat-lbl">Supporters this month</p>
        </div>
        <div className="dsk-np-stat-card">
          <p className="dsk-np-stat-num dark" style={{ fontSize: 34 }}>4</p>
          <p className="dsk-np-stat-lbl">Events with backing this month</p>
        </div>
      </div>

      <div className="dsk-np-panel" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={18} color="var(--blue)" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Settlement ready — Stripe Connected Account active</p>
        </div>
        <button type="button" className="np-link-btn" onClick={() => notify('Opening Stripe settlement dashboard…')}>Manage →</button>
      </div>

      <div className="dsk-np-panel">
        <div className="dsk-np-panel-head"><span className="dsk-np-panel-title">Backing by event</span></div>
        {BACKING_BY_EVENT.map((ev) => (
          <div key={ev.id} className="backing-row">
            <img className="backing-thumb" src={ev.thumb} alt={ev.title} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{ev.title}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{ev.count} supporters</span>
          </div>
        ))}
      </div>

      <p className="dsk-np-financials-note">
        Payout processing is managed by Stripe. For detailed financials, open your Stripe dashboard.{' '}
        <button
          type="button"
          className="np-link-btn"
          style={{ display: 'inline' }}
          onClick={() => notify('Opening Stripe dashboard…')}
        >
          Open Stripe →
        </button>
      </p>
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
