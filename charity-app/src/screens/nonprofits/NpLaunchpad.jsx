import { useNavigate } from 'react-router-dom';
import { Bell, Clock, Flag, ChevronRight, MoreHorizontal } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const LIVE_EVENTS = [
  { id: 1, title: 'Coastal Cleanup Drive', stat: '87 joined', isLive: true, bg: 'linear-gradient(135deg,#FF8C42,#F5604A)' },
  { id: 2, title: 'Books for Bright Minds', stat: '150 backing', isLive: false, bg: 'linear-gradient(135deg,#8B6914,#C8960C)' },
];

export default function NpLaunchpad() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Header */}
        <div className="np-header">
          <h1 className="np-header-title">Launchpad</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell size={22} color="var(--dark)" style={{ cursor: 'pointer' }} />
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0D7377,#14A085)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>OC</div>
          </div>
        </div>

        <div style={{ padding: '0 18px 24px' }}>
          {/* Flow switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--primary)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', textAlign: 'center' }}
              onClick={() => navigate('/feed')}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>SE Flow</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Tap to switch →</p>
            </div>
            <div style={{ flex: 1, background: 'var(--blue)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', textAlign: 'center' }}
              onClick={() => navigate('/guest/feed')}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>Guest Flow</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Tap to switch →</p>
            </div>
            <div style={{ flex: 1, background: '#0D9488', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>NP Flow</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Current screen</p>
            </div>
          </div>

          {/* Org card */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#0D7377,#14A085)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: 'white',
              }}>OC</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Ocean Conservancy</p>
                <span className="verified-badge" style={{ marginTop: 3, display: 'inline-flex' }}>
                  ✓ Verified 501(c)(3) · Active
                </span>
              </div>
            </div>
            <button
              className="btn-ghost"
              style={{ fontSize: 13, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/np/profile')}
            >
              View profile <ChevronRight size={13} />
            </button>
          </div>

          {/* Stats row */}
          <div className="np-stats-row">
            <div className="np-stat">
              <div className="np-stat-num" style={{ color: 'var(--primary)' }}>4</div>
              <div className="np-stat-lbl">Live Events</div>
            </div>
            <div className="np-stat" style={{ cursor: 'pointer' }} onClick={() => navigate('/np/approvals')}>
              <div className="np-stat-num" style={{ color: 'var(--primary)' }}>3</div>
              <div className="np-stat-lbl">Pending Approvals</div>
            </div>
            <div className="np-stat">
              <div className="np-stat-num" style={{ color: 'var(--dark)' }}>87</div>
              <div className="np-stat-lbl">Backers This Week</div>
            </div>
          </div>

          {/* Action required */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Action required</p>
            <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: 11, fontWeight: 700 }}>
              3 ITEMS
            </span>
          </div>

          <div className="action-item coral-border" style={{ cursor: 'pointer' }} onClick={() => navigate('/np/approvals')}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Clock size={16} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>New event request</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Maya R. wants to run 'Coastal Cleanup Wave 2'
              </p>
            </div>
            <ChevronRight size={16} color="var(--text-light)" />
          </div>

          <div className="action-item blue-border" style={{ cursor: 'pointer' }} onClick={() => navigate('/np/activity')}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Flag size={16} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>1 content item flagged</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Comment reported in 'Books for Bright Minds'
              </p>
            </div>
            <ChevronRight size={16} color="var(--text-light)" />
          </div>

          {/* Live events */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Your live events</p>
            <button className="btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}
              onClick={() => navigate('/np/approvals')}>
              See all <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {LIVE_EVENTS.map((ev) => (
              <div key={ev.id} className="lp-event-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className={`badge ${ev.isLive ? 'badge-live' : 'badge-upcoming'}`} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)' }}>
                    {ev.isLive ? '● LIVE' : 'UPCOMING'}
                  </span>
                  <MoreHorizontal size={16} color="var(--text-light)" style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ height: 70, borderRadius: 8, background: ev.bg, marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{ev.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <NpBottomNav active="home" />
      </div>
    </div>
  );
}
