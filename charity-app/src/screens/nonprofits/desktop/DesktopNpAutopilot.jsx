import { useState } from 'react';
import { Check, Settings, Info } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const CHECKS = [
  'SE verified & in good standing',
  'Event has media + story',
  'No policy-sensitive keywords',
  'Valid future date range',
];

const TRUSTED_SES = [
  { id: 1, name: 'Mike Rivera', events: 5, avatar: '/events/breakneck-ridge-run/img4.jpg' },
];

const CANDIDATE_SES = [
  { name: 'Jordan P.', avatar: '/events/give-now/img3.jpg' },
  { name: 'Sofia L.', avatar: '/events/neon-night/img2.jpg' },
];

export default function DesktopNpAutopilot() {
  const [enabled, setEnabled] = useState(true);
  const [trusted, setTrusted] = useState(TRUSTED_SES);

  const addTrusted = () => {
    const c = CANDIDATE_SES[trusted.length % CANDIDATE_SES.length];
    setTrusted((prev) => [...prev, { id: Date.now(), name: c.name, events: 0, avatar: c.avatar }]);
  };

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
        <button className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle autopilot">
          <div className="toggle-thumb" />
        </button>
      </div>

      <div className="dsk-np-two-col">
        <div className="dsk-np-panel">
          <p className="dsk-np-panel-title" style={{ marginBottom: 12 }}>Autopilot checks before auto-approving</p>
          {CHECKS.map((c) => (
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
          {trusted.map((se) => (
            <div key={se.id} className="trusted-row">
              <img src={se.avatar} alt={se.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{se.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{se.events} events approved</p>
              </div>
              <button className="np-link-btn" style={{ color: 'var(--primary)' }} onClick={() => setTrusted((prev) => prev.filter((s) => s.id !== se.id))}>Remove</button>
            </div>
          ))}
          <button type="button" className="np-link-btn" style={{ marginTop: 8 }} onClick={addTrusted}>+ Add trusted SE</button>
        </div>
      </div>

      <div className="dsk-np-panel dsk-np-disable-row">
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Disable Autopilot entirely</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Returns all SE events to manual review. This cannot be undone automatically.</p>
        </div>
        <button className="ap-btn-reject" style={{ padding: '10px 20px', borderRadius: 'var(--radius-pill)' }} onClick={() => setEnabled(false)}>Disable Autopilot</button>
      </div>
    </DesktopNpLayout>
  );
}
