import { useState } from 'react';
import { Check, Settings, Info } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { useNpAutopilot } from '../../../hooks/useNpAutopilot';

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

export default function DesktopNpAutopilot() {
  const {
    enabled,
    checks,
    trusted,
    candidateSeId,
    loading,
    error,
    toggleEnabled,
    setAutopilotEnabled,
    removeTrusted,
    addTrusted,
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

  const handleAdd = async () => {
    if (!candidateSeId) {
      notify('No pending SE available to trust');
      return;
    }
    try {
      await addTrusted();
      notify('Trusted SE added');
    } catch {
      notify('Could not add trusted SE');
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
      <DesktopNpLayout active="approvals" title="Autopilot Settings">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading…</div>
      </DesktopNpLayout>
    );
  }

  if (error) {
    return (
      <DesktopNpLayout active="approvals" title="Autopilot Settings">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load autopilot settings'}
        </div>
      </DesktopNpLayout>
    );
  }

  return (
    <DesktopNpLayout active="approvals" title="Autopilot Settings">
      <p className="dsk-page-subtitle" style={{ marginBottom: 24 }}>Manage automated workflows and trusted partner configurations.</p>

      <div className="dsk-np-panel" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div className="np-autopilot-info-icon"><Settings size={18} color="var(--blue)" /></div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Autopilot auto-approves events from trusted SEs</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>You stay in control. Turn it off anytime. We'll still alert you to anything suspicious.</p>
        </div>
      </div>

      <div className="dsk-np-panel dsk-np-autopilot-toggle-row">
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 3 }}>Enable Autopilot</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{enabled ? 'Active — events from trusted SEs auto-publish' : 'Off — all events go to manual review'}</p>
        </div>
        <button className={`toggle ${enabled ? 'on' : ''}`} onClick={handleToggle} aria-label="Toggle autopilot">
          <div className="toggle-thumb" />
        </button>
      </div>

      <div className="dsk-np-two-col">
        <div className="dsk-np-panel">
          <p className="dsk-np-panel-title" style={{ marginBottom: 12 }}>Autopilot checks before auto-approving</p>
          {checks.map((c) => (
            <div key={c} className="auto-check">
              <div className="blue-check-circle"><Check size={11} color="white" strokeWidth={3} /></div>
              <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.4 }}>{c}</p>
            </div>
          ))}
          <div className="np-autopilot-rule-note">
            <Info size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
            <p>Any rule failure → manual review</p>
          </div>
        </div>

        <div className="dsk-np-panel">
          <p className="dsk-np-panel-title" style={{ marginBottom: 12 }}>Trusted social entrepreneurs ({trusted.length})</p>
          {trusted.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>No trusted SEs yet.</p>
          )}
          {trusted.map((se) => (
            <div key={se.id} className="trusted-row">
              <img src={se.avatar} alt={se.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{se.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{se.events} events approved</p>
              </div>
              <button className="np-link-btn" style={{ color: 'var(--primary)' }} onClick={() => handleRemove(se)}>Remove</button>
            </div>
          ))}
          <button type="button" className="np-link-btn" style={{ marginTop: 8 }} onClick={handleAdd}>+ Add trusted SE</button>
        </div>
      </div>

      <div className="dsk-np-panel dsk-np-disable-row">
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Disable Autopilot entirely</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Returns all SE events to manual review. This cannot be undone automatically.</p>
        </div>
        <button className="ap-btn-reject" style={{ padding: '10px 20px', borderRadius: 'var(--radius-pill)' }} onClick={handleDisable}>Disable Autopilot</button>
      </div>
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
