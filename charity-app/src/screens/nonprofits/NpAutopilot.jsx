import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Plus, Info } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const CHECKS = [
  'SE must be verified and in good standing',
  'Event must have media and story text',
  'No policy-sensitive keywords flagged',
  'Date range must be valid (future)',
];

const TRUSTED_SES = [
  { id: 1, name: 'Maya R.', events: 3, initials: 'MR', bg: 'linear-gradient(135deg,#F5604A,#FF8A65)' },
  { id: 2, name: 'David K.', events: 2, initials: 'DK', bg: 'linear-gradient(135deg,#7B1FA2,#AB47BC)' },
];

export default function NpAutopilot() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [trusted, setTrusted] = useState(TRUSTED_SES);

  const removeTrusted = (id) => setTrusted((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Header */}
        <div style={{ padding: '52px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="back-btn" onClick={() => navigate('/np/home')}>
              <ChevronLeft size={18} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>Autopilot</h1>
          </div>
        </div>

        <div style={{ padding: '0 18px 24px' }}>
          {/* Info card */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: 'var(--blue-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>⚙️</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                  Autopilot auto-approves events from trusted SEs
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  You stay in control. Turn it off anytime. We'll still alert you to anything suspicious.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="toggle-wrap">
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 3 }}>
                  Enable Autopilot
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {enabled
                    ? 'Autopilot is active. Events from trusted SEs auto-publish.'
                    : 'Autopilot is off. All events go to manual review.'}
                </p>
              </div>
              <div className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
              Autopilot checks before auto-approving
            </p>
            {CHECKS.map((c, i) => (
              <div key={i} className="auto-check">
                <div className="blue-check-circle">
                  <Check size={11} color="white" strokeWidth={3} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.4 }}>{c}</p>
              </div>
            ))}

            {/* Rule failure note */}
            <div style={{
              background: 'var(--bg)', borderRadius: 8, padding: '10px 12px',
              display: 'flex', gap: 8, alignItems: 'center', marginTop: 12,
            }}>
              <Info size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Any rule failure → returns to manual review
              </p>
            </div>
          </div>

          {/* Trusted SEs */}
          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
              Trusted social entrepreneurs ({trusted.length})
            </p>

            {trusted.map((se) => (
              <div key={se.id} className="trusted-row">
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: se.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white',
                }}>{se.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{se.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {se.events} events approved
                  </p>
                </div>
                <button
                  style={{
                    background: 'none', border: 'none', color: 'var(--primary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onClick={() => removeTrusted(se.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', color: 'var(--blue)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', marginTop: 12, padding: 0,
              }}
            >
              <Plus size={16} color="var(--blue)" />
              Add trusted SE
            </button>
          </div>

          {/* Disable Autopilot (destructive) */}
          <div style={{ textAlign: 'center' }}>
            <button
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => setEnabled(false)}
            >
              Disable Autopilot
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              This returns all SE events to manual review
            </p>
          </div>
        </div>

        <NpBottomNav active="settings" />
      </div>
    </div>
  );
}
