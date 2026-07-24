import { useNavigate } from 'react-router-dom';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import { ToastHost } from '../../../components/Toast';
import { useIdentityGateFlow } from '../../../auth/useIdentityGateFlow';

export default function DesktopIdentityGateJoin() {
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
              onClick={() => navigate('/guest/feed')}
            >
              Not now — keep browsing
            </button>
          </div>
        </div>
      </main>
      <ToastHost toast={toast} />
    </div>
  );
}
