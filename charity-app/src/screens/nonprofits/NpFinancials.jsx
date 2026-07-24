import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Info, ExternalLink } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import MobileAppHeader from '../../components/MobileAppHeader';
import { eventDisplayTitle } from '../../data/mockData';
import { useNpFinancials } from '../../hooks/useNpDashboard';

function formatCurrency(value) {
  return `$${(value ?? 0).toLocaleString()}`;
}

function settlementReady(status) {
  return (status ?? '').toLowerCase() === 'ready';
}

export default function NpFinancials() {
  const navigate = useNavigate();
  const { data, loading, error } = useNpFinancials();
  const [stripeOpen, setStripeOpen] = useState(false);

  const revenueByEvent = data?.revenueByEvent ?? [];
  const stripeReady = settlementReady(data?.settlementStatus);

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load financials'}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen">
        <MobileAppHeader
          layout="bar"
          homePath="/np/home"
          left={(
            <button type="button" className="back-btn" onClick={() => navigate('/np/home')} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
          )}
        />
        <div className="np-page-title-wrap">
          <h1 className="np-page-title" style={{ fontSize: 24 }}>Financials</h1>
        </div>

        <div style={{ padding: '0 18px 24px' }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', lineHeight: 1 }}>{formatCurrency(data.totalRaised)}</span>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 }}>
                  Total raised to date
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)', lineHeight: 1 }}>{data.supporters}</span>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 }}>
                  Supporters this month
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              borderTop: '1px solid var(--border)', paddingTop: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Events with backing this month</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{data.eventsWithBacking}</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Check size={18} color="var(--blue)" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                  {stripeReady ? 'Settlement ready' : `Settlement ${data.settlementStatus}`}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stripe Connected Account active</p>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}
                onClick={() => setStripeOpen((o) => !o)}
              >
                {stripeOpen ? 'Hide' : 'Manage'} <ChevronLeft size={12} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
            {stripeOpen && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Stripe Connected Account · acct_1OceanConserv</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>$12,480.00 available for payout</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Last transfer · Oct 18, 2025</p>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Revenue by event</p>
            {revenueByEvent.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No revenue recorded yet.</p>
            ) : (
              revenueByEvent.map((ev) => (
                <div key={ev.id} className="backing-row">
                  <img className="backing-thumb" src={ev.thumb} alt={ev.title} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{eventDisplayTitle(ev.title)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{formatCurrency(ev.raised)}</span>
                </div>
              ))
            )}
          </div>

          <div className="info-banner" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Payout processing is managed by Stripe. For detailed financials, visit your Stripe dashboard.
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, marginLeft: 26 }}
              onClick={() => setStripeOpen(true)}
            >
              Open Stripe <ExternalLink size={12} />
            </button>
          </div>
        </div>

        <NpBottomNav active="activity" />
      </div>
    </div>
  );
}
