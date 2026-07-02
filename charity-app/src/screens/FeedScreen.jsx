import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Bell, Plus, Megaphone, Building2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';

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

        {/* Feed placeholder cards */}
        <div style={{ padding: '16px 18px 16px' }}>
          {[1, 2].map((i) => (
            <div key={i} className="card" style={{ marginBottom: 14 }}>
              <div style={{
                height: 120,
                background: i === 1
                  ? 'linear-gradient(135deg, #F5604A 0%, #FF8A65 100%)'
                  : 'linear-gradient(135deg, #0D7377 0%, #14A085 100%)',
                borderRadius: 8, marginBottom: 10,
              }} />
              <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, width: '70%', marginBottom: 6 }} />
              <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '45%' }} />
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
