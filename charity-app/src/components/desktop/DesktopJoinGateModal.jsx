import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function DesktopJoinGateModal({
  open,
  onClose,
  eventTitle = 'Neon Night Run',
  nonprofit = 'Youth Health Fund',
  npInitials = 'YH',
  npBg = 'var(--primary)',
}) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

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
          Not now — keep browsing
        </button>
      </div>
    </div>
  );
}
