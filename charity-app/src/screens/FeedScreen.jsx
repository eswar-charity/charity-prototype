import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Bell, Plus, Megaphone, Building2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { events } from '../data/mockData';

const FEED_EVENTS = [events[0], events[1]];

export default function FeedScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSheet, setShowSheet] = useState(location.pathname === '/create-event');

  return (
    <div className="phone-shell">
      <div className="screen" style={{ position: 'relative' }}>
        {/* Feed top bar */}
        <div className="feed-top-bar">
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>SJ</span>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Discover Feed</span>
          <Bell size={20} color="white" />
        </div>

        {/* Teal hero area */}
        <div style={{ height: 180, background: 'linear-gradient(160deg, #0D7377 0%, #14A085 100%)', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 4,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
          }} />
        </div>

        {/* Flow switcher */}
        <div style={{ padding: '16px 18px 0', display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--primary)', borderRadius: 12,
            padding: '10px 14px', cursor: 'pointer', textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>SE / Organiser Flow</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Current screen</p>
          </div>
          <div
            style={{
              flex: 1, background: 'var(--blue)', borderRadius: 12,
              padding: '10px 14px', cursor: 'pointer', textAlign: 'center',
            }}
            onClick={() => navigate('/guest/feed')}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>Guest Flow</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Tap to switch →</p>
          </div>
        </div>

        {/* Feed event cards */}
        <div style={{ padding: '16px 18px 16px' }}>
          {FEED_EVENTS.map((ev) => (
            <div key={ev.id} className="card" style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
              <div style={{
                height: 130,
                backgroundImage: `url(${ev.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)',
                }} />
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                  {ev.isLive && (
                    <span className="live-badge" style={{ fontSize: 10 }}>
                      <span className="live-dot" />LIVE NOW
                    </span>
                  )}
                  <span className="badge" style={{ background: ev.catBg, color: ev.catColor, fontSize: 10 }}>
                    {ev.category}
                  </span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 3 }}>{ev.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.date} · {ev.location}</p>
              </div>
            </div>
          ))}
        </div>

        <BottomNav active="feed" onPlusClick={() => setShowSheet(true)} />
      </div>

      {/* Bottom sheet overlay */}
      {showSheet && (
        <div
          className="overlay-bg"
          onClick={() => { setShowSheet(false); if (location.pathname === '/create-event') navigate('/feed'); }}
        >
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', textAlign: 'center', marginBottom: 6 }}>
              Start something good
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Create a free event for any verified nonprofit. Your story drives real participation.
            </p>

            <div className="opt-row" onClick={() => { setShowSheet(false); navigate('/event/step-1'); }}>
              <div className="opt-icon" style={{ background: 'var(--primary)' }}>
                <Megaphone size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Create an event</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  For a verified nonprofit of your choice.
                </p>
              </div>
              <Compass size={16} color="var(--text-light)" />
            </div>

            <div className="opt-row" onClick={() => setShowSheet(false)}>
              <div className="opt-icon" style={{ background: 'var(--blue)' }}>
                <Building2 size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>I represent a nonprofit</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Register your 501(c)(3) on Charity Hub.
                </p>
              </div>
              <Compass size={16} color="var(--text-light)" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
