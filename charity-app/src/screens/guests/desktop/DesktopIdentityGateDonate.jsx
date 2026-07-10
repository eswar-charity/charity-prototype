import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';

export default function DesktopIdentityGateDonate() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <main className="dsk-main">
        <div className="dsk-container dsk-join-gate-page">
          <div className="dsk-join-gate-card">
            <div className="dsk-join-gate-event">
              <div className="dsk-donate-gate-icon" style={{ background: 'var(--primary)' }}>
                <Heart size={16} color="white" fill="white" />
              </div>
              <div>
                <p className="dsk-join-gate-event-title">Ocean Coastal Restoration</p>
                <p className="dsk-join-gate-event-sub">Ocean Conservancy</p>
              </div>
            </div>

            <h1 className="dsk-join-gate-heading">Back this cause</h1>
            <p className="dsk-join-gate-copy">
              Sign in to contribute. Every backing helps the Ocean Conservancy do more.
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
            <button type="button" className="btn-ghost dsk-join-gate-dismiss" onClick={() => navigate(-1)}>
              Maybe later — keep browsing
            </button>

            <div className="dsk-donate-gate-privacy">
              <Lock size={12} color="var(--text-light)" />
              <span>You&apos;ll return here after signing in</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
