import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUGGESTIONS = ['Clarify description', 'Update event photo', 'Check location', 'Add volunteer info'];
const HERO_IMG = '/events/breakneck-ridge-run/img1.jpg';

export default function NpRequestChanges() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');

  const appendSuggestion = (s) => {
    setFeedback((prev) => prev ? `${prev} ${s.toLowerCase()}.` : `${s}.`);
  };

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
              <img src={HERO_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            Request changes from Mike Rivera.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
            Mike will be notified and can resubmit after making updates.
          </p>

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
              <button key={s} type="button" className="quick-chip" onClick={() => appendSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ marginBottom: 8, opacity: feedback.trim() ? 1 : 0.5 }}
            disabled={!feedback.trim()}
            onClick={() => navigate('/np/approvals')}
          >
            Send request
          </button>

          <button
            type="button"
            onClick={() => navigate('/np/approvals/review')}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', padding: '10px 0',
            }}
          >
            Cancel
          </button>
        </div>
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
