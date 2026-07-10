import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Home, Search, Plus, Heart } from 'lucide-react';

const BACKER_COLORS = ['var(--primary)', '#0D7377', '#7B1FA2'];

const REC_EVENTS = [
  {
    id: 1,
    title: 'Beach Cleanup',
    date: 'Fri, Nov 12',
    bg: 'linear-gradient(160deg,#C4A882 0%,#8B9B8A 40%,#4A6A8A 80%)',
  },
  {
    id: 2,
    title: 'Reef Dive',
    date: 'Sat, Nov 14',
    bg: 'linear-gradient(160deg,#006064 0%,#00838F 50%,#00BCD4 100%)',
  },
];

export default function ExpiredEvent() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          {/* Hero */}
          <div className="detail-hero" style={{ height: 220 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg,#C4A882 0%,#8B9B8A 40%,#4A6A8A 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
            }} />

            {/* Back */}
            <button
              className="back-btn"
              style={{
                position: 'absolute', top: 48, left: 14,
                background: 'rgba(255,255,255,0.2)', border: 'none',
              }}
              onClick={() => navigate('/guest/feed')}
            >
              <ChevronLeft size={18} color="white" />
            </button>

            {/* Recently Completed badge */}
            <div style={{
              position: 'absolute', bottom: 50, left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <span className="completed-badge">
                <CheckCircle size={13} />
                Recently Completed
              </span>
            </div>
          </div>

          {/* White card */}
          <div className="detail-card">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              This event has ended
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Ocean Coastal Restoration wrapped up on Oct 7.
            </p>

            {/* Backers row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div className="av-stack">
                {BACKER_COLORS.map((c, i) => (
                  <div key={i} className="av" style={{ background: c }} />
                ))}
                <div className="av" style={{ background: 'var(--border)', color: 'var(--text-secondary)', fontSize: 9, fontWeight: 700 }}>
                  +2
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 500 }}>
                213 people backed this event for Ocean Conservancy
              </p>
            </div>

            <button
              className="btn-ghost"
              style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20, marginTop: 6 }}
              onClick={() => navigate('/guest/feed')}
            >
              <span style={{ color: 'var(--blue)' }}>Inspired? Explore events happening now →</span>
            </button>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
                You might love these
              </p>

              <div className="rec-grid">
                {REC_EVENTS.map((ev) => (
                  <div
                    key={ev.id}
                    className="rec-card"
                    onClick={() => navigate('/guest/event/upcoming')}
                  >
                    <div className="rec-hero" style={{ background: ev.bg }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                        borderRadius: 'inherit',
                      }} />
                      <p style={{
                        position: 'absolute', bottom: 8, left: 10, right: 10,
                        fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.3,
                      }}>
                        {ev.title}
                      </p>
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="event-bar" style={{ justifyContent: 'center' }}>
          <button
            className="event-bar-btn"
            style={{ maxWidth: 280 }}
            onClick={() => navigate('/guest/donate')}
          >
            Back this Nonprofit
          </button>
        </div>

        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => navigate('/guest/feed')}>
            <Home size={22} /><span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/empty')}>
            <Search size={22} /><span>Search</span>
          </button>
          <button className="nav-center-btn" onClick={() => navigate('/guest/join')}>
            <Plus size={24} />
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/join')}>
            <Heart size={22} /><span>Saved</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span>Sign up</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
