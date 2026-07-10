import { useState } from 'react';
import { Check } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const BACKING_BY_EVENT = [
  { id: 1, title: 'Coastal Cleanup Drive', count: 87, thumb: '/events/breakneck-ridge-run/img1.jpg' },
  { id: 2, title: 'Books for Bright Minds', count: 42, thumb: '/events/give-now/img1.jpg' },
  { id: 3, title: 'Plant a Tree', count: 28, thumb: '/events/dog-dad/img1.jpg' },
];

export default function DesktopNpActivity() {
  const [stripeOpen, setStripeOpen] = useState(false);

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
        <button type="button" className="np-link-btn" onClick={() => setStripeOpen((o) => !o)}>
          {stripeOpen ? 'Hide' : 'Manage →'}
        </button>
      </div>
      {stripeOpen && (
        <div className="dsk-np-panel" style={{ marginTop: -8, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Stripe Connected Account · acct_1OceanConserv</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>$12,480.00 available</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Next payout · Friday, Oct 31</p>
        </div>
      )}

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
          onClick={() => setStripeOpen(true)}
        >
          Open Stripe →
        </button>
      </p>
    </DesktopNpLayout>
  );
}
