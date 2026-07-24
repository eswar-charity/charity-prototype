import { useNavigate } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import { ToastHost } from '../../../components/Toast';
import { useIdentityGateFlow } from '../../../auth/useIdentityGateFlow';

export default function DesktopIdentityGateDonate() {
  const navigate = useNavigate();
  const {
    mode, phone, setPhone, email, setEmail, pending, toast,
    handleContinue, switchToEmail, switchToPhone,
  } = useIdentityGateFlow();

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

            {mode === 'phone' ? (
              <div className="dsk-join-gate-phone">
                <div className="dsk-join-gate-dial">+1</div>
                <input
                  className="dsk-join-gate-input"
                  type="tel"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={pending}
                />
              </div>
            ) : (
              <input
                className="dsk-join-gate-input"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                style={{ marginBottom: 14, width: '100%', borderRadius: 12 }}
              />
            )}

            <button
              type="button"
              className="dsk-cta-btn dsk-join-gate-cta"
              disabled={pending}
              onClick={handleContinue}
            >
              {pending ? 'Continuing…' : 'Continue'}
            </button>
            <button
              type="button"
              className="btn-ghost dsk-join-gate-secondary"
              disabled={pending}
              onClick={mode === 'phone' ? switchToEmail : switchToPhone}
            >
              {mode === 'phone' ? 'Use email instead' : 'Use phone instead'}
            </button>
            <button
              type="button"
              className="btn-ghost dsk-join-gate-dismiss"
              disabled={pending}
              onClick={() => navigate(-1)}
            >
              Maybe later — keep browsing
            </button>

            <div className="dsk-donate-gate-privacy">
              <Lock size={12} color="var(--text-light)" />
              <span>You&apos;ll return here after signing in</span>
            </div>
          </div>
        </div>
      </main>
      <ToastHost toast={toast} />
    </div>
  );
}
