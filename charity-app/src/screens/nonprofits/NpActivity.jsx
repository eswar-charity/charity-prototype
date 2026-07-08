import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const BACKING_BY_EVENT = [
  { id: 1, title: 'Coastal Cleanup Drive', count: 87, thumb: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop' },
  { id: 2, title: 'Books for Bright Minds', count: 42, thumb: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop' },
  { id: 3, title: 'Plant a Tree', count: 28, thumb: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=100&h=100&fit=crop' },
];

export default function NpActivity() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <div className="np-page-header">
            <button type="button" className="back-btn" onClick={() => navigate('/np/home')} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
            <h1 className="np-page-title">Activity</h1>
          </div>

          <div style={{ padding: '0 18px 8px' }}>
            <div className="card" style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>This month&apos;s activity</p>
              <div className="np-activity-stat-num">47</div>
              <p className="np-activity-stat-lbl">Supporters</p>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Events with backing this month</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>4</span>
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
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Settlement ready</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stripe Connected Account active</p>
                </div>
                <button type="button" className="np-link-btn">Manage →</button>
              </div>
            </div>

            <div className="card">
              <div className="np-section-header" style={{ marginBottom: 8 }}>
                <p className="np-section-title">Backing by event</p>
                <button type="button" className="np-see-all">See all</button>
              </div>
              {BACKING_BY_EVENT.map((ev) => (
                <div key={ev.id} className="backing-row">
                  <img className="backing-thumb" src={ev.thumb} alt={ev.title} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{ev.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{ev.count} supporters</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <NpBottomNav active="activity" />
      </div>
    </div>
  );
}
