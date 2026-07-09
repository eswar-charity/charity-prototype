import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';

export default function IdentityGateJoin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  return (
    <div className="phone-shell">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero behind */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg,#FF8C42 0%,var(--primary) 30%,#2C4B6E 65%,#1A2F48 100%)',
          position: 'relative',
          minHeight: 180,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.25) 100%)',
          }} />
        </div>

        {/* Bottom sheet (non-dismissible) */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 0',
          marginTop: -24,
        }}>
          <div className="sheet-handle" />

          {/* Event row */}
          <div className="gate-event-row">
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(160deg,#FF8C42,var(--primary))',
            }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Ocean Coastal Restoration</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ocean Conservancy</p>
            </div>
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 30, fontWeight: 800, color: 'var(--dark)',
            textAlign: 'center', letterSpacing: -0.5, marginBottom: 8,
          }}>
            Join the movement
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-secondary)',
            textAlign: 'center', lineHeight: 1.5, marginBottom: 22,
          }}>
            Create your account to back this event and be part of the story.
          </p>

          {/* Phone input */}
          <div style={{ display: 'flex', marginBottom: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '16px 14px',
              background: 'var(--primary-soft)',
              borderRadius: '16px 0 0 16px',
              border: '1.5px solid transparent',
              borderRight: 'none',
              fontSize: 15, fontWeight: 600, color: 'var(--dark)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>🇺🇸</span> +1
            </div>
            <input
              className="input-field input-soft"
              type="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ borderRadius: '0 16px 16px 0', flex: 1 }}
            />
          </div>

          <button className="btn-primary" style={{ marginBottom: 14 }} onClick={() => navigate('/about-you')}>
            Continue
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            or sign in with email
          </p>

          <button
            className="btn-outline"
            style={{ marginBottom: 14 }}
            onClick={() => navigate('/about-you')}
          >
            Use email instead
          </button>

          <button
            className="btn-ghost"
            style={{ display: 'block', margin: '0 auto 24px', fontSize: 14 }}
            onClick={() => navigate('/guest/feed')}
          >
            Not now — keep browsing
          </button>
        </div>

        {/* Bottom nav visible behind (shown as part of context) */}
        <nav className="bottom-nav">
          <button className="nav-item" onClick={() => navigate('/guest/feed')}>
            <Home size={22} /><span>Feed</span>
          </button>
          <button className="nav-item active" onClick={() => navigate('/guest/feed')}>
            <Compass size={22} /><span>Explore</span>
          </button>
          <button className="nav-center-btn" onClick={() => navigate('/feed')}>
            <Plus size={24} />
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/feed')}>
            <Bell size={22} /><span>Activity</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/')}>
            <User size={22} /><span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
