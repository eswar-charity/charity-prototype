import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ChangeAreaPicker from '../../components/ChangeAreaPicker';
import { useNpReviewDetail } from '../../hooks/useNpApprovals';
import { npReviewPath } from '../../utils/npApprovalAdapter';
import { CHANGE_AREAS } from '../../utils/changeRequestAreas';

const SUGGESTIONS = [
  { label: 'Clarify description', area: 'media_story' },
  { label: 'Update event photo', area: 'media_story' },
  { label: 'Check location', area: 'date_location' },
  { label: 'Add volunteer info', area: 'media_story' },
];

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

export default function NpRequestChanges() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const { event, loading, requestChanges } = useNpReviewDetail();
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
    if (!text || !areas.length) return;
    try {
      await requestChanges(text, areas);
      notify('Change request sent');
      navigate('/np/approvals');
    } catch {
      notify('Could not send change request');
    }
  };

  const heroImg = event?.cover || (event?.key ? `/events/${event.key}/img1.jpg` : '/events/breakneck-ridge-run/img1.jpg');
  const organizerName = event?.organizer || 'the organizer';
  const reviewPath = eventId ? npReviewPath(eventId) : '/np/approvals/review';
  const canSend = !!feedback.trim() && areas.length > 0;

  if (loading && !event) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="np-request-backdrop">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <ChevronIcon />
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', opacity: 0.45 }}>Review event</span>
            </div>
            <div className="review-banner" style={{ marginBottom: 12, opacity: 0.7 }}>
              <p className="review-banner-title">You&apos;re reviewing this event</p>
              <p className="review-banner-sub">It won&apos;t go live until you approve it.</p>
            </div>
            <div style={{ height: 120, borderRadius: 12, overflow: 'hidden', opacity: 0.5 }}>
              <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(254,242,238,0.72)',
            backdropFilter: 'blur(4px)',
          }} />
        </div>

        <div className="np-request-sheet">
          <div className="sheet-handle" />

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
            Request changes from {organizerName}.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
            Choose which sections they can edit, then describe what to fix.
          </p>

          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Sections to unlock ({areas.length}/{CHANGE_AREAS.length})
          </p>
          <ChangeAreaPicker selected={areas} onChange={setAreas} />

          <textarea
            className="input-field input-soft"
            placeholder="Describe what needs to be changed. Be specific and constructive. Example: Please update the event description to clarify volunteer requirements."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ minHeight: 120, marginBottom: 16, borderRadius: 16 }}
          />

          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Quick suggestions
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s.label} type="button" className="quick-chip" onClick={() => appendSuggestion(s)}>
                {s.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ marginBottom: 8, opacity: canSend ? 1 : 0.5 }}
            disabled={!canSend}
            onClick={handleSend}
          >
            Send request
          </button>

          <button
            type="button"
            onClick={() => navigate(reviewPath)}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', padding: '10px 0',
            }}
          >
            Cancel
          </button>
        </div>
        {toast && <div style={TOAST_STYLE}>{toast}</div>}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" opacity="0.4">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
