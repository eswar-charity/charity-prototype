import { X } from 'lucide-react';
import { ToastHost } from '../Toast';
import { useIdentityGateFlow } from '../../auth/useIdentityGateFlow';
import { getIdentityGateCopy } from '../../utils/identityGateIntent';

export default function DesktopJoinGateModal({
  open,
  onClose,
  eventTitle = 'this event',
  nonprofit = 'the nonprofit',
  npInitials = 'NP',
  npBg = 'var(--primary)',
  intent = 'default',
  returnTo,
}) {
  const copy = getIdentityGateCopy(intent);
  const {
    mode, phone, setPhone, email, setEmail, pending, toast,
    handleContinue, switchToEmail, switchToPhone,
  } = useIdentityGateFlow({ onSuccess: onClose, returnTo, intent });

  if (!open) return null;

  return (
    <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
      <div className="dsk-modal dsk-join-gate-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={copy.headline}>
        <div className="dsk-modal-head">
          <h3>{copy.headline}</h3>
          <button type="button" className="dsk-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="dsk-join-gate-event">
          <div className="dsk-sidebar-np-avatar" style={{ background: npBg }}>{npInitials}</div>
          <div>
            <p className="dsk-join-gate-event-title">{eventTitle}</p>
            <p className="dsk-join-gate-event-sub">{nonprofit}</p>
          </div>
        </div>

        <p className="dsk-join-gate-copy">{copy.body}</p>

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
          Not now — keep browsing
        </button>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
