import { useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User, Settings, TriangleAlert, Pencil } from 'lucide-react';
import { liveActivities } from '../data/mockData';

export default function LiveDashboard() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '52px 18px 0' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>My Event</p>
            <Settings size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
          </div>

          {/* Alert banner */}
          <div className="alert-banner">
            <TriangleAlert size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.4 }}>
                1 comment flagged for review. Tap to moderate.
              </p>
              <button className="btn-ghost" style={{ marginTop: 4, fontSize: 12 }}>Review</button>
            </div>
          </div>

          {/* Event card row */}
          <div className="event-card-row" style={{ marginBottom: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #81C784, #4CAF50)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Charity Hub Event</p>
              <div className="live-badge" style={{ marginTop: 4 }}>
                <div className="live-dot" />
                LIVE NOW
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <div className="stat-box">
              <div className="stat-num">87</div>
              <div className="stat-lbl">Joined</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">213</div>
              <div className="stat-lbl">Backing</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">38</div>
              <div className="stat-lbl">Updates</div>
            </div>
          </div>

          {/* Action chips */}
          <div className="action-chips" style={{ marginBottom: 20 }}>
            <button className="action-chip">Post update</button>
            <button className="action-chip">Add photo</button>
            <button className="action-chip">Share event</button>
          </div>

          {/* Live activity section */}
          <div className="section-header">
            <p className="section-title">Live activity</p>
          </div>

          {/* Activity items */}
          {liveActivities.map((act) => (
            <div key={act.id} className="activity-item">
              <div className="act-avatar" style={{ background: act.color }}>
                {act.initials}
              </div>
              <div style={{ flex: 1 }}>
                {act.type === 'join' && (
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                    {act.text}
                  </p>
                )}
                {act.type === 'update' && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                      {act.user}
                      {act.isOrganizer && (
                        <Pencil size={12} color="var(--blue)" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                      )}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5, marginBottom: 8 }}>
                      {act.text}
                    </p>
                    <div style={{
                      height: 100,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                      overflow: 'hidden',
                    }} />
                  </>
                )}
                {act.type === 'org' && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                      {act.user}{' '}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'var(--blue)',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        justifyContent: 'center',
                        verticalAlign: 'middle',
                      }}>✓</span>
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>
                      {act.text}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => navigate('/live-dashboard')}>
            <Home size={22} />
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/feed')}>
            <Compass size={22} />
            <span>Explore</span>
          </button>
          <button className="nav-center-btn" onClick={() => navigate('/create-event')}>
            <Plus size={24} />
          </button>
          <button className="nav-item" onClick={() => navigate('/post-event')}>
            <Bell size={22} />
            <span>Activity</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/feed')}>
            <User size={22} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
