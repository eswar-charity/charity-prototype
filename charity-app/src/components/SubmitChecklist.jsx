import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, X } from 'lucide-react';
import { useCreateEventDraft, updateDraft } from '../hooks/useCreateEventDraft';
import { isStepAllowed } from '../utils/changeRequestAreas';
import { isStepComplete } from '../utils/eventDraftValidation';

const GUIDELINES = [
  'Keep event stories honest, respectful, and free of misleading claims.',
  'Use only media you own or have permission to share.',
  'Fundraising must benefit the verified nonprofit linked to your event.',
  'No hate speech, harassment, or inappropriate content.',
  'Charity Hub may review and moderate content before publication.',
];

function formatDateRange(draft) {
  if (draft.endDate && draft.endDate !== draft.startDate) {
    return `${draft.startDate} – ${draft.endDate}`;
  }
  return draft.startDate;
}

function formatDatesLocation(draft) {
  const dates = formatDateRange(draft);
  const location = draft.location?.trim();
  if (location) {
    return `Dates & location: ${dates} · ${location}`;
  }
  return `Dates & location: ${dates}`;
}

export default function SubmitChecklist({ draft, nonprofit }) {
  const navigate = useNavigate();
  const liveDraft = useCreateEventDraft();
  const source = draft || liveDraft;
  const [showGuidelines, setShowGuidelines] = useState(false);

  const fixMode = !!source.fixMode;
  const allowedSteps = fixMode ? source.allowedSteps : null;
  const guidelinesReviewed = !!source.guidelinesReviewed;

  const hasMedia = isStepComplete(1, source);
  const hasNonprofit = isStepComplete(2, source, nonprofit);
  const hasDatesLocation = isStepComplete(3, source);

  const items = useMemo(() => {
    const all = [
      {
        id: 1,
        step: 1,
        text: `Story media added (${source.photos.length} item${source.photos.length === 1 ? '' : 's'})`,
        done: hasMedia,
        path: '/event/step-1',
      },
      {
        id: 2,
        step: 2,
        text: `Nonprofit selected: ${nonprofit?.name || 'Choose a nonprofit'}`,
        done: hasNonprofit,
        path: '/event/step-2',
      },
      {
        id: 3,
        step: 3,
        text: formatDatesLocation(source),
        done: hasDatesLocation,
        path: '/event/step-3',
      },
      {
        id: 4,
        step: null,
        text: 'Review Charity Hub content guidelines',
        done: guidelinesReviewed,
        isLink: true,
        action: 'guidelines',
      },
    ];

    if (!fixMode) return all;

    // In fix mode, only show checklist rows for requested steps (+ guidelines).
    return all.filter((item) => item.step == null || isStepAllowed(allowedSteps, item.step));
  }, [source, nonprofit, guidelinesReviewed, hasMedia, hasNonprofit, hasDatesLocation, fixMode, allowedSteps]);

  const handleClick = (item) => {
    if (item.action === 'guidelines') {
      setShowGuidelines(true);
      return;
    }
    if (item.path && isStepAllowed(allowedSteps, item.step)) {
      navigate(item.path);
    }
  };

  const acknowledgeGuidelines = () => {
    updateDraft({ guidelinesReviewed: true });
    setShowGuidelines(false);
  };

  return (
    <>
      {fixMode && source.changeFeedback ? (
        <div className="info-banner" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--dark)' }}>Requested changes: </strong>
            {source.changeFeedback}
          </p>
        </div>
      ) : null}

      {fixMode ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.45 }}>
          Only the steps below were requested — update those, then resubmit.
        </p>
      ) : null}

      <div className="card submit-checklist-card">
        {items.map((item) => {
          const locked = item.step != null && !isStepAllowed(allowedSteps, item.step);
          return (
            <button
              key={item.id}
              type="button"
              className="check-item check-item-btn"
              onClick={() => handleClick(item)}
              disabled={locked}
              style={locked ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            >
              <div className={`check-circle ${item.done ? 'checked' : ''}`}>
                {item.done && <Check size={12} strokeWidth={3} />}
                {locked && !item.done && <Lock size={11} strokeWidth={2.5} />}
              </div>
              <span
                className={item.isLink && !item.done ? 'check-item-link' : undefined}
                style={{
                  color: item.isLink && !item.done ? 'var(--blue)' : 'var(--dark)',
                  textDecoration: item.isLink && !item.done ? 'underline' : 'none',
                }}
              >
                {item.text}
              </span>
            </button>
          );
        })}
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
