import { X, Check, Users, Shield } from 'lucide-react';
import useIsDesktop from '../../hooks/useIsDesktop';

const BACKER_POOL = [
  { name: 'Priya M.', initials: 'PM', color: 'var(--primary)', amount: 50 },
  { name: 'James L.', initials: 'JL', color: '#0D7377', amount: 25 },
  { name: 'Sofia R.', initials: 'SR', color: '#7B1FA2', amount: 100 },
  { name: 'Marcus T.', initials: 'MT', color: '#1976D2', amount: 40 },
  { name: 'Elena K.', initials: 'EK', color: '#F57C00', amount: 75 },
  { name: 'David W.', initials: 'DW', color: '#388E3C', amount: 30 },
];

function ModalShell({ title, onClose, children, wide }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
        <div
          className={`dsk-modal${wide ? ' dsk-modal--wide' : ''}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={title}
        >
          <div className="dsk-modal-head">
            <h3>{title}</h3>
            <button type="button" className="dsk-modal-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-bg" onClick={onClose} role="presentation">
      <div className="bottom-sheet event-detail-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-handle" />
        <div className="event-detail-sheet-head">
          <h2 className="event-detail-sheet-title">{title}</h2>
          <button type="button" className="event-detail-sheet-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NonprofitLearnMoreModal({
  open,
  onClose,
  name,
  initials,
  avatarStyle,
  category,
  ein = '81-4419920',
  description,
  eventsHosted = 3,
  raisedTotal = '$54.2k',
  onViewProfile,
}) {
  if (!open) return null;

  return (
    <ModalShell title="About this nonprofit" onClose={onClose}>
      <div className="np-learn-hero">
        <div className="np-learn-avatar" style={avatarStyle}>{initials}</div>
        <div>
          <p className="np-learn-name">{name}</p>
          <span className="np-verified-badge">
            <Check size={11} strokeWidth={3} /> Verified 501(c)(3)
          </span>
        </div>
      </div>

      <div className="np-learn-meta">
        <span>{category}</span>
        <span className="np-learn-meta-sep">·</span>
        <span>EIN {ein}</span>
      </div>

      <p className="dsk-modal-section-lbl" style={{ marginTop: 0 }}>ABOUT</p>
      <p className="dsk-modal-section-text">{description}</p>

      <div className="np-learn-stats">
        <div className="np-learn-stat">
          <span className="np-learn-stat-num">{eventsHosted}</span>
          <span className="np-learn-stat-lbl">Active events</span>
        </div>
        <div className="np-learn-stat">
          <span className="np-learn-stat-num">{raisedTotal}</span>
          <span className="np-learn-stat-lbl">Raised on Charity Hub</span>
        </div>
      </div>

      <div className="np-learn-trust">
        <Shield size={16} color="var(--blue)" />
        <p>Donations are processed securely and go directly to this verified nonprofit.</p>
      </div>

      {onViewProfile && (
        <button type="button" className="btn-primary np-learn-cta" onClick={onViewProfile}>
          View nonprofit profile
        </button>
      )}
    </ModalShell>
  );
}

export function EventBackersModal({
  open,
  onClose,
  count,
  eventTitle,
  raised,
}) {
  if (!open) return null;

  const backers = BACKER_POOL.slice(0, Math.min(6, Math.max(4, Math.round(count / 25))));

  return (
    <ModalShell title="People backing this event" onClose={onClose} wide>
      <p className="backers-modal-intro">
        <strong>{count} people</strong> are backing{' '}
        <strong>{eventTitle}</strong>. Every backer helps the organiser grow participation before doors open.
      </p>

      <div className="backers-modal-summary">
        <Users size={16} color="var(--primary)" />
        <span>{count} backers</span>
        {raised != null && (
          <>
            <span className="backers-modal-summary-sep">·</span>
            <span>${raised.toLocaleString()} raised so far</span>
          </>
        )}
      </div>

      <ul className="backers-modal-list">
        {backers.map((b) => (
          <li key={b.name} className="backers-modal-row">
            <div className="backers-modal-avatar" style={{ background: b.color }}>{b.initials}</div>
            <div className="backers-modal-body">
              <p className="backers-modal-name">{b.name}</p>
              <p className="backers-modal-action">Backed ${b.amount}</p>
            </div>
          </li>
        ))}
      </ul>

      {count > backers.length && (
        <p className="backers-modal-more">+ {count - backers.length} more supporters</p>
      )}
    </ModalShell>
  );
}
