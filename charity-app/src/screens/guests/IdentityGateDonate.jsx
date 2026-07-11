import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function IdentityGateDonate() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  return (
    <div className="phone-shell">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg,#795548 0%,#BCAAA4 50%,#E8C4B8 100%)',
          position: 'relative',
          minHeight: 160,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Bottom sheet */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 36px',
          marginTop: -24,
        }}>
          <div className="sheet-handle" />

          {/* Event icon row */}
          <div className="gate-event-row">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Ocean Coastal Restoration</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ocean Conservancy</p>
            </div>
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: 'var(--dark)',
            letterSpacing: -0.4, marginBottom: 8,
          }}>
            Back this cause
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-secondary)',
            lineHeight: 1.55, marginBottom: 22,
          }}>
            Sign in to contribute. Every backing helps the Ocean Conservancy do more.
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
              +1
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
            style={{ display: 'block', margin: '0 auto 18px', fontSize: 14 }}
            onClick={() => navigate(-1)}
          >
            Maybe later — keep browsing
          </button>

          {/* Privacy note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Lock size={12} color="var(--text-light)" />
            <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center' }}>
              You'll return here after signing in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
