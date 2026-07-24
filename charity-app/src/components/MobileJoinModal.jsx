import { ToastHost } from './Toast';
import { useIdentityGateFlow } from '../auth/useIdentityGateFlow';

/**
 * Guest identity gate as a bottom sheet over the current screen — same
 * pattern as MobileShareModal, so joining/backing (and gated nav actions)
 * no longer jump to a separate full-screen gradient page.
 */
export default function MobileJoinModal({ title, subtitle, onClose }) {
  const {
    mode, phone, setPhone, email, setEmail, pending, toast,
    handleContinue, switchToEmail, switchToPhone,
  } = useIdentityGateFlow({ onSuccess: onClose });

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

        {mode === 'phone' ? (
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
              disabled={pending}
              style={{ borderRadius: '0 16px 16px 0', flex: 1 }}
            />
          </div>
        ) : (
          <input
            className="input-field input-soft"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            style={{ marginBottom: 14 }}
          />
        )}

        <button
          type="button"
          className="btn-primary"
          style={{ marginBottom: 14 }}
          disabled={pending}
          onClick={handleContinue}
        >
          {pending ? 'Continuing…' : 'Continue'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          {mode === 'phone' ? 'or sign in with email' : 'or use your mobile number'}
        </p>

        <button
          type="button"
          className="btn-outline"
          style={{ marginBottom: 14 }}
          disabled={pending}
          onClick={mode === 'phone' ? switchToEmail : switchToPhone}
        >
          {mode === 'phone' ? 'Use email instead' : 'Use phone instead'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ display: 'block', margin: '0 auto 8px', fontSize: 14 }}
          disabled={pending}
          onClick={onClose}
        >
          Not now — keep browsing
        </button>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
