import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Settings, Info } from 'lucide-react';

const CHECKS = [
  'SE must be verified and in good standing',
  'Event must have media and story text',
  'No policy-sensitive keywords flagged',
  'Date range must be valid (future)',
];

const TRUSTED_SES = [
  { id: 1, name: 'Maya R.', events: 3, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 2, name: 'David K.', events: 2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
];

export default function NpAutopilot() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [trusted, setTrusted] = useState(TRUSTED_SES);

  const removeTrusted = (id) => setTrusted((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <div className="np-page-header">
            <button type="button" className="back-btn" onClick={() => navigate('/np/approvals')} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
            <h1 className="np-page-title">Autopilot</h1>
          </div>

          <div style={{ padding: '0 18px 24px' }}>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="np-autopilot-info-icon">
                  <Settings size={18} color="var(--blue)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                    Autopilot auto-approves events from trusted SEs.
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    You stay in control. Turn it off anytime. We&apos;ll still alert you to anything suspicious.
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
              <div className="toggle-wrap" style={{ padding: 0 }}>
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
                <button
                  type="button"
                  className={`toggle ${enabled ? 'on' : ''}`}
                  onClick={() => setEnabled(!enabled)}
                  aria-label="Toggle autopilot"
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
                Autopilot checks before auto-approving
              </p>
              {CHECKS.map((c) => (
                <div key={c} className="auto-check">
                  <div className="blue-check-circle">
                    <Check size={11} color="white" strokeWidth={3} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.4 }}>{c}</p>
                </div>
              ))}
              <div className="np-autopilot-rule-note">
                <Info size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
                <p>Any rule failure → returns to manual review.</p>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                Trusted social entrepreneurs ({trusted.length})
              </p>
              {trusted.map((se) => (
                <div key={se.id} className="trusted-row">
                  <img
                    src={se.avatar}
                    alt={se.name}
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{se.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{se.events} events approved</p>
                  </div>
                  <button
                    type="button"
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
            </div>

            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <button
                type="button"
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
        </div>
      </div>
    </div>
  );
}
