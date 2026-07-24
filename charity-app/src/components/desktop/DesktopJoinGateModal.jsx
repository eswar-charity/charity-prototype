import { X } from 'lucide-react';
import { events } from '../../data/mockData';
import { ToastHost } from '../Toast';
import { useIdentityGateFlow } from '../../auth/useIdentityGateFlow';

const DEFAULT_EVENT = events[0];

export default function DesktopJoinGateModal({
  open,
  onClose,
  eventTitle = DEFAULT_EVENT?.title,
  nonprofit = DEFAULT_EVENT?.nonprofit,
  npInitials = DEFAULT_EVENT?.npInitials,
  npBg = DEFAULT_EVENT?.npBg,
}) {
  const {
    mode, phone, setPhone, email, setEmail, pending, toast,
    handleContinue, switchToEmail, switchToPhone,
  } = useIdentityGateFlow({ onSuccess: onClose });

  if (!open) return null;

  return (
    <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
      <div className="dsk-modal dsk-join-gate-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Join to participate">
        <div className="dsk-modal-head">
          <h3>Join the movement</h3>
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

        <p className="dsk-join-gate-copy">
          Create your account to join the chat, back this event, and be part of the story.
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
          Not now — keep browsing
        </button>
        <ToastHost toast={toast} />
      </div>
    </div>
  );
}
