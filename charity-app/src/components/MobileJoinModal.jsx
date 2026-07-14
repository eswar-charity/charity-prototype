import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Guest identity gate as a bottom sheet over the current screen — same
 * pattern as MobileShareModal, so joining/backing (and gated nav actions)
 * no longer jump to a separate full-screen gradient page.
 */
export default function MobileJoinModal({ title, subtitle, onClose }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  return (
    <div className="overlay-bg" onClick={onClose} role="presentation">
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Join the movement">
        <div className="sheet-handle" />

        {(title || subtitle) && (
          <div className="gate-event-row">
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(160deg,#0D4A8A,var(--primary))',
            }} />
            <div>
              {title && <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{title}</p>}
              {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>}
            </div>
          </div>
        )}

        <h2 style={{
          fontSize: 26, fontWeight: 800, color: 'var(--dark)',
          textAlign: 'center', letterSpacing: -0.5, marginBottom: 8, marginTop: title || subtitle ? 4 : 8,
        }}>
          Join the movement
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)',
          textAlign: 'center', lineHeight: 1.5, marginBottom: 22,
        }}>
          Create your account to back this event and be part of the story.
        </p>

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

        <button className="btn-outline" style={{ marginBottom: 14 }} onClick={() => navigate('/about-you')}>
          Use email instead
        </button>

        <button
          className="btn-ghost"
          style={{ display: 'block', margin: '0 auto 8px', fontSize: 14 }}
          onClick={onClose}
        >
          Not now — keep browsing
        </button>
      </div>
    </div>
  );
}
