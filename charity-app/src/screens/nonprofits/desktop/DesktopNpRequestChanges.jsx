import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ChangeAreaPicker from '../../../components/ChangeAreaPicker';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { useNpReviewDetail } from '../../../hooks/useNpApprovals';
import { npReviewPath } from '../../../utils/npApprovalAdapter';
import { CHANGE_AREAS } from '../../../utils/changeRequestAreas';

const SUGGESTIONS = [
  { label: 'Clarify description', area: 'media_story' },
  { label: 'Update event photo', area: 'media_story' },
  { label: 'Check location', area: 'date_location' },
  { label: 'Add volunteer info', area: 'media_story' },
];

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

export default function DesktopNpRequestChanges() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const { event, loading, error, requestChanges, actionPending } = useNpReviewDetail();
  const [feedback, setFeedback] = useState('');
  const [areas, setAreas] = useState([]);
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const appendSuggestion = (s) => {
    setFeedback((prev) => (prev ? `${prev} ${s.label.toLowerCase()}.` : `${s.label}.`));
    setAreas((prev) => (prev.includes(s.area) ? prev : [...prev, s.area]));
  };

  const handleSend = async () => {
    const text = feedback.trim();
    if (!text || !areas.length || actionPending) return;
    try {
      await requestChanges(text, areas);
      notify('Change request sent');
      navigate('/np/approvals');
    } catch {
      notify('Could not send change request');
    }
  };

  const organizerName = event?.organizer || 'the organizer';
  const firstName = organizerName.split(' ')[0] || organizerName;
  const reviewPath = eventId ? npReviewPath(eventId) : '/np/approvals/review';
  const heroImg = event?.cover || (event?.key ? `/events/${event.key}/img1.jpg` : '/events/give-now/img1.jpg');
  const canSend = !!feedback.trim() && areas.length > 0 && !actionPending;

  if (loading && !event) {
    return (
      <DesktopNpLayout active="approvals" title="Request changes">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading…</div>
      </DesktopNpLayout>
    );
  }

  if (error && !event) {
    return (
      <DesktopNpLayout active="approvals" title="Request changes">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load event'}
        </div>
      </DesktopNpLayout>
    );
  }

  return (
    <DesktopNpLayout active="approvals" title="Request changes">
      <div className="dsk-np-review-banner">
        Request changes for {event?.title || 'this event'} — it won&apos;t go live until updates are approved
      </div>

      <div className="dsk-np-request-grid">
        <div className="dsk-np-review-section">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>
            Request changes from {organizerName}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.55 }}>
            {firstName} will only be able to edit the sections you unlock below.
          </p>

          <p className="dsk-np-review-side-title" style={{ marginBottom: 10 }}>
            Sections to unlock ({areas.length}/{CHANGE_AREAS.length})
          </p>
          <ChangeAreaPicker selected={areas} onChange={setAreas} />

          <label htmlFor="dsk-np-request-feedback" className="dsk-np-review-side-title" style={{ display: 'block' }}>
            Feedback
          </label>
          <textarea
            id="dsk-np-request-feedback"
            className="input-field input-soft"
            placeholder="Describe what needs to be changed. Be specific and constructive. Example: Please update the event description to clarify volunteer requirements."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ minHeight: 140, marginBottom: 16, borderRadius: 12, width: '100%' }}
          />

          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Quick suggestions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s.label} type="button" className="quick-chip" onClick={() => appendSuggestion(s)}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="review-bar-outline"
              style={{ flex: 'none', padding: '13px 22px' }}
              onClick={() => navigate(reviewPath)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dsk-cta-btn"
              style={{ opacity: canSend ? 1 : 0.5 }}
              disabled={!canSend}
              onClick={handleSend}
            >
              {actionPending ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>

        <aside className="dsk-sidebar-card">
          <div
            style={{
              height: 140,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 14,
              backgroundImage: `url(${heroImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            role="img"
            aria-label={event?.title || 'Event'}
          />
          <p className="dsk-np-review-side-title">{event?.title || 'Event'}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
            by {organizerName}
          </p>
          {event?.date && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{event.date}</p>
          )}
          {event?.location && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{event.location}</p>
          )}
        </aside>
      </div>

      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
