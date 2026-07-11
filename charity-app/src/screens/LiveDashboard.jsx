import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User, Settings, TriangleAlert, Pencil, X } from 'lucide-react';
import { liveActivities } from '../data/mockData';
import MobileAppHeader from '../components/MobileAppHeader';

export default function LiveDashboard() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  const [postSheet, setPostSheet] = useState(false);
  const [update, setUpdate] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const shareEvent = () => {
    const link = 'https://charityhub.app/e/neon-night-run';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(
        () => showToast('Event link copied'),
        () => showToast('Event link ready to share')
      );
    } else {
      showToast('Event link ready to share');
    }
  };

  const postUpdate = () => {
    setPostSheet(false);
    setUpdate('');
    showToast('Update posted to your event');
  };

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '0 18px 0' }}>
          <MobileAppHeader
            homePath="/feed"
            title="My Event"
            actions={(
              <button
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Settings"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <Settings size={20} color="var(--text-secondary)" />
              </button>
            )}
          />
          <div style={{ paddingTop: 4 }}>

          {/* Alert banner */}
          {showAlert && (
            <div className="alert-banner">
              <TriangleAlert size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.4 }}>
                  1 comment flagged for review. Tap to moderate.
                </p>
                <button
                  className="btn-ghost"
                  style={{ marginTop: 4, fontSize: 12 }}
                  onClick={() => {
                    setShowAlert(false);
                    showToast('Comment reviewed');
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Event card row */}
          <div className="event-card-row" style={{ marginBottom: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              backgroundImage: 'url(/events/neon-night/img1.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Neon Night Run</p>
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
            <button className="action-chip" onClick={() => setPostSheet(true)}>Post update</button>
            <button className="action-chip" onClick={() => showToast('Photo added to your event')}>Add photo</button>
            <button className="action-chip" onClick={shareEvent}>Share event</button>
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
                      backgroundImage: `url(${act.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
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
          <button className="nav-center-btn" aria-label="Create event" onClick={() => navigate('/create-event')}>
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

      {/* Post update bottom sheet */}
      {postSheet && (
        <div className="overlay-bg" onClick={() => setPostSheet(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>Post an update</p>
              <button
                onClick={() => setPostSheet(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>
            <textarea
              className="input-field"
              aria-label="Write an update to your supporters"
              placeholder="Share what's happening with your supporters…"
              value={update}
              onChange={(e) => setUpdate(e.target.value)}
              style={{ minHeight: 110, marginBottom: 14 }}
            />
            <button
              className="btn-primary"
              onClick={postUpdate}
              disabled={!update.trim()}
              style={update.trim() ? undefined : { opacity: 0.5 }}
            >
              Post update
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
