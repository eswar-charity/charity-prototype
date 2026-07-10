import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopHeader from '../../../components/desktop/DesktopHeader';

export default function DesktopIdentityGateJoin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <main className="dsk-main">
        <div className="dsk-container dsk-join-gate-page">
          <div className="dsk-join-gate-card">
            <div className="dsk-join-gate-event">
              <div className="dsk-sidebar-np-avatar" style={{ background: 'var(--primary)' }}>OC</div>
              <div>
                <p className="dsk-join-gate-event-title">Ocean Coastal Restoration</p>
                <p className="dsk-join-gate-event-sub">Ocean Conservancy</p>
              </div>
            </div>

            <h1 className="dsk-join-gate-heading">Join the movement</h1>
            <p className="dsk-join-gate-copy">
              Create your account to back this event and be part of the story.
            </p>

            <div className="dsk-join-gate-phone">
              <div className="dsk-join-gate-dial">+1</div>
              <input
                className="dsk-join-gate-input"
                type="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button type="button" className="dsk-cta-btn dsk-join-gate-cta" onClick={() => navigate('/about-you')}>
              Continue
            </button>
            <button type="button" className="btn-ghost dsk-join-gate-secondary" onClick={() => navigate('/about-you')}>
              Use email instead
            </button>
            <button type="button" className="btn-ghost dsk-join-gate-dismiss" onClick={() => navigate('/guest/feed')}>
              Not now — keep browsing
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
