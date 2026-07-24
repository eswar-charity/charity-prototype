import { useState } from 'react';
import { Check } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { eventDisplayTitle } from '../../../data/mockData';
import { useNpFinancials } from '../../../hooks/useNpDashboard';

function formatCurrency(value) {
  return `$${(value ?? 0).toLocaleString()}`;
}

function settlementReady(status) {
  return (status ?? '').toLowerCase() === 'ready';
}

export default function DesktopNpFinancials() {
  const { data, loading, error } = useNpFinancials();
  const [stripeOpen, setStripeOpen] = useState(false);

  const revenueByEvent = data?.revenueByEvent ?? [];
  const stripeReady = settlementReady(data?.settlementStatus);

  if (loading) {
    return (
      <DesktopNpLayout active="financials" title="Financials">
        <p style={{ color: 'var(--text-secondary)' }}>Loading financials…</p>
      </DesktopNpLayout>
    );
  }

  if (error || !data) {
    return (
      <DesktopNpLayout active="financials" title="Financials">
        <p style={{ color: 'var(--text-secondary)' }}>{error?.message || 'Could not load financials'}</p>
      </DesktopNpLayout>
    );
  }

  return (
    <DesktopNpLayout active="financials" title="Financials">
      <div className="dsk-np-stats-row">
        <div className="dsk-np-stat-card">
          <p className="dsk-np-stat-num dark" style={{ fontSize: 34 }}>{formatCurrency(data.totalRaised)}</p>
          <p className="dsk-np-stat-lbl">Total raised to date</p>
        </div>
        <div className="dsk-np-stat-card">
          <p className="dsk-np-stat-num dark" style={{ fontSize: 34 }}>$12,480</p>
          <p className="dsk-np-stat-lbl">Available for payout</p>
        </div>
      </div>

      <div className="dsk-np-panel" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={18} color="var(--blue)" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
            {stripeReady ? 'Settlement ready — Stripe Connected Account active' : `Settlement ${data.settlementStatus}`}
          </p>
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
        <div className="dsk-np-panel-head"><span className="dsk-np-panel-title">Revenue by event</span></div>
        {revenueByEvent.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No revenue recorded yet.</p>
        ) : (
          revenueByEvent.map((ev) => (
            <div key={ev.id} className="backing-row">
              <img className="backing-thumb" src={ev.thumb} alt={ev.title} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{eventDisplayTitle(ev.title)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCurrency(ev.raised)}</span>
            </div>
          ))
        )}
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
