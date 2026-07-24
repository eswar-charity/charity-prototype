import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Settings, Info } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';
import { useNpAutopilot } from '../../hooks/useNpAutopilot';

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

export default function NpAutopilot() {
  const navigate = useNavigate();
  const {
    enabled,
    checks,
    trusted,
    loading,
    error,
    toggleEnabled,
    setAutopilotEnabled,
    removeTrusted,
  } = useNpAutopilot();
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const handleToggle = async () => {
    try {
      await toggleEnabled();
      notify(enabled ? 'Autopilot turned off' : 'Autopilot turned on');
    } catch {
      notify('Could not update autopilot');
    }
  };

  const handleRemove = async (se) => {
    try {
      await removeTrusted(se.seUserId);
      notify(`${se.name} removed from trusted SEs`);
    } catch {
      notify('Could not remove trusted SE');
    }
  };

  const handleDisable = async () => {
    try {
      await setAutopilotEnabled(false);
      notify('Autopilot disabled');
    } catch {
      notify('Could not disable autopilot');
    }
  };

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load autopilot settings'}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            layout="bar"
            homePath="/np/home"
            left={(
              <button type="button" className="back-btn" onClick={() => navigate('/np/approvals')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
            )}
          />
          <div className="np-page-title-wrap">
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
                  onClick={handleToggle}
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
              {checks.map((c) => (
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
              {trusted.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>No trusted SEs yet.</p>
              )}
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
                    onClick={() => handleRemove(se)}
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
                onClick={handleDisable}
              >
                Disable Autopilot
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                This returns all SE events to manual review
              </p>
            </div>
          </div>
        </div>
        {toast && <div style={TOAST_STYLE}>{toast}</div>}
      </div>
    </div>
  );
}
