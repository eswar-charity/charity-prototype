import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, X } from 'lucide-react';
import { events } from '../../data/mockData';

const DEFAULT_EVENT = events[0];

export default function DesktopDonateGateModal({
  open,
  onClose,
  amount = 25,
  eventTitle = DEFAULT_EVENT?.title,
  nonprofit = DEFAULT_EVENT?.nonprofit,
  npInitials = DEFAULT_EVENT?.npInitials,
  npBg = DEFAULT_EVENT?.npBg,
}) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

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
        <button type="button" className="btn-ghost dsk-join-gate-dismiss" onClick={onClose}>
          Maybe later — keep browsing
        </button>

        <div className="dsk-donate-gate-privacy">
          <Lock size={12} color="var(--text-light)" />
          <span>You&apos;ll return here after signing in</span>
        </div>
      </div>
    </div>
  );
}
