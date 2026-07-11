import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const GUIDELINES = [
  'Keep event stories honest, respectful, and free of misleading claims.',
  'Use only media you own or have permission to share.',
  'Fundraising must benefit the verified nonprofit linked to your event.',
  'No hate speech, harassment, or inappropriate content.',
  'Charity Hub may review and moderate content before publication.',
];

export default function SubmitChecklist({ draft, nonprofit }) {
  const navigate = useNavigate();
  const [guidelinesReviewed, setGuidelinesReviewed] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const items = useMemo(() => [
    {
      id: 1,
      text: `Story media added (${draft.photos.length} item${draft.photos.length === 1 ? '' : 's'})`,
      done: draft.photos.length > 0 && draft.story.trim().length > 0,
      path: '/event/step-1',
    },
    {
      id: 2,
      text: `Nonprofit selected: ${nonprofit?.name || 'Choose a nonprofit'}`,
      done: !!nonprofit,
      path: '/event/step-2',
    },
    {
      id: 3,
      text: draft.location?.trim()
        ? `Dates set: ${draft.startDate}`
        : `Dates & location: ${draft.startDate}`,
      done: Boolean(draft.startDate && draft.location?.trim()),
      path: '/event/step-3',
    },
    {
      id: 4,
      text: 'Review Charity Hub content guidelines',
      done: guidelinesReviewed,
      isLink: true,
      action: 'guidelines',
    },
  ], [draft, nonprofit, guidelinesReviewed]);

  const handleClick = (item) => {
    if (item.action === 'guidelines') {
      setShowGuidelines(true);
      return;
    }
    if (item.path) navigate(item.path);
  };

  const acknowledgeGuidelines = () => {
    setGuidelinesReviewed(true);
    setShowGuidelines(false);
  };

  return (
    <>
      <div className="card submit-checklist-card">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="check-item check-item-btn"
            onClick={() => handleClick(item)}
          >
            <div className={`check-circle ${item.done ? 'checked' : ''}`}>
              {item.done && <Check size={12} strokeWidth={3} />}
            </div>
            <span
              className={item.isLink && !item.done ? 'check-item-link' : undefined}
              style={{ color: item.isLink && !item.done ? 'var(--blue)' : 'var(--dark)', textDecoration: item.isLink && !item.done ? 'underline' : 'none' }}
            >
              {item.text}
            </span>
          </button>
        ))}
      </div>

      {showGuidelines && (
        <div className="submit-checklist-modal-backdrop" onClick={() => setShowGuidelines(false)} role="presentation">
          <div className="submit-checklist-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Charity Hub content guidelines">
            <div className="submit-checklist-modal-head">
              <h3>Content guidelines</h3>
              <button type="button" className="submit-checklist-modal-close" onClick={() => setShowGuidelines(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <ul className="submit-checklist-guidelines">
              {GUIDELINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={acknowledgeGuidelines}>
              I understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
