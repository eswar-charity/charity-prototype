import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { eventDisplayTitle } from '../../../utils/eventDisplay';
import { useNpFinancials } from '../../../hooks/useNpDashboard';
import StripeConnectCard from '../../../components/StripeConnectCard';

function formatCurrency(value) {
  return `$${(value ?? 0).toLocaleString()}`;
}

export default function DesktopNpFinancials() {
  const { data, loading, error } = useNpFinancials();

  const revenueByEvent = data?.revenueByEvent ?? [];

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
          <p className="dsk-np-stat-num dark" style={{ fontSize: 34 }}>{data.supporters}</p>
          <p className="dsk-np-stat-lbl">Supporters</p>
        </div>
      </div>

      <StripeConnectCard variant="desktop" />

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
