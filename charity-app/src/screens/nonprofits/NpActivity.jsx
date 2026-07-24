import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import MobileAppHeader from '../../components/MobileAppHeader';
import { eventDisplayTitle } from '../../data/mockData';
import { useNpActivity } from '../../hooks/useNpDashboard';

const INITIAL_VISIBLE = 3;

function settlementReady(status) {
  return (status ?? '').toLowerCase() === 'ready';
}

export default function NpActivity() {
  const navigate = useNavigate();
  const { data, loading, error } = useNpActivity();
  const [stripeOpen, setStripeOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const backingByEvent = data?.backingByEvent ?? [];
  const visibleEvents = showAll ? backingByEvent : backingByEvent.slice(0, INITIAL_VISIBLE);
  const settlementStatus = data?.settlement?.status ?? 'Pending';
  const stripeReady = settlementReady(settlementStatus);

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
          {error?.message || 'Could not load activity'}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
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
            <h1 className="np-page-title">Activity</h1>
          </div>

          <div style={{ padding: '0 18px 8px' }}>
            <div className="card" style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>This month&apos;s activity</p>
              <div className="np-activity-stat-num">{data.supporters}</div>
              <p className="np-activity-stat-lbl">Supporters</p>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Events with backing this month</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{data.eventsWithBacking}</span>
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
                    {stripeReady ? 'Settlement ready' : `Settlement ${settlementStatus}`}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {data.settlement?.connected ? 'Stripe Connected Account active' : 'Stripe account pending'}
                  </p>
                </div>
                <button type="button" className="np-link-btn" onClick={() => setStripeOpen((o) => !o)}>
                  {stripeOpen ? 'Hide' : 'Manage →'}
                </button>
              </div>
              {stripeOpen && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Stripe Connected Account · acct_1OceanConserv
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>$12,480.00 available</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Next payout · Friday, Oct 31</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="np-section-header" style={{ marginBottom: 8 }}>
                <p className="np-section-title">Backing by event</p>
                {backingByEvent.length > INITIAL_VISIBLE && (
                  <button type="button" className="np-see-all" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show less' : 'See all'}
                  </button>
                )}
              </div>
              {backingByEvent.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No backing activity yet.</p>
              ) : (
                visibleEvents.map((ev) => (
                  <div key={ev.id} className="backing-row">
                    <img className="backing-thumb" src={ev.thumb} alt={ev.title} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{eventDisplayTitle(ev.title)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{ev.count} supporters</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <NpBottomNav active="activity" />
      </div>
    </div>
  );
}
