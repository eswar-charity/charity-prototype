import { Heart, Lock, X } from 'lucide-react';
import { ToastHost } from '../Toast';
import { useIdentityGateFlow } from '../../auth/useIdentityGateFlow';

export default function DesktopDonateGateModal({
  open,
  onClose,
  amount = 25,
  eventTitle = 'this event',
  nonprofit = 'the nonprofit',
  npInitials = 'NP',
  npBg = 'var(--primary)',
}) {
  const {
    mode, phone, setPhone, email, setEmail, pending, toast,
    handleContinue, switchToEmail, switchToPhone,
  } = useIdentityGateFlow({ onSuccess: onClose });

  if (!open) return null;

  const amountLabel = typeof amount === 'number' ? `$${amount}` : 'your chosen amount';

  return (
    <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
      <div className="dsk-modal dsk-join-gate-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Sign in to donate">
        <div className="dsk-modal-head">
          <h3>Back this cause</h3>
          <button type="button" className="dsk-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="dsk-join-gate-event">
          <div className="dsk-donate-gate-icon" style={{ background: npBg }}>
            <Heart size={16} color="white" fill="white" />
          </div>
          <div>
            <p className="dsk-join-gate-event-title">{eventTitle}</p>
            <p className="dsk-join-gate-event-sub">{nonprofit}</p>
          </div>
        </div>

        <p className="dsk-donate-gate-amount">
          You&apos;re backing <strong>{amountLabel}</strong>
        </p>
        <p className="dsk-join-gate-copy">
          Sign in to contribute. Every backing helps {nonprofit} do more.
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
        <button type="button" className="btn-ghost dsk-join-gate-dismiss" disabled={pending} onClick={onClose}>
          Maybe later — keep browsing
        </button>

        <div className="dsk-donate-gate-privacy">
          <Lock size={12} color="var(--text-light)" />
          <span>You&apos;ll return here after signing in</span>
        </div>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
