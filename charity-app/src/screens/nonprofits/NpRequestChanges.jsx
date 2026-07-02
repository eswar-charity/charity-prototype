import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NpBottomNav from '../../components/NpBottomNav';

const SUGGESTIONS = ['Clarify description', 'Update event photo', 'Check location', 'Add volunteer info'];

export default function NpRequestChanges() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');

  const appendSuggestion = (s) => {
    setFeedback((prev) => prev ? `${prev} ${s.toLowerCase()}.` : `${s}.`);
  };

  return (
    <div className="phone-shell">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Blurred launchpad background */}
        <div style={{
          flex: 1,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 120,
        }}>
          {/* Fake launchpad preview behind */}
          <div style={{ position: 'absolute', top: 20, left: 18, right: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronIcon />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', opacity: 0.4 }}>Launchpad</span>
              </div>
            </div>
            {/* Mock blurred content */}
            {[1, 2].map((i) => (
              <div key={i} style={{
                height: 48, background: 'var(--white)', borderRadius: 12,
                marginBottom: 8, opacity: 0.35,
              }} />
            ))}
          </div>
          {/* Frosted overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,245,242,0.6)',
            backdropFilter: 'blur(3px)',
          }} />
        </div>

        {/* Bottom sheet */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 0',
          marginTop: -24,
          position: 'relative', zIndex: 2,
        }}>
          <div className="sheet-handle" />

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
            Request changes from Maya R.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
            Maya will be notified and can resubmit after making updates.
          </p>

          <textarea
            className="input-field input-soft"
            placeholder="Describe what needs to be changed. Be specific and constructive. Example: Please update the event description to clarify volunteer requirements."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            style={{ minHeight: 120, marginBottom: 16 }}
          />

          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Quick suggestions
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="quick-chip" onClick={() => appendSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ marginBottom: 8, opacity: feedback.trim() ? 1 : 0.5 }}
            disabled={!feedback.trim()}
            onClick={() => navigate('/np/approvals')}
          >
            Send request
          </button>
        </div>

        <NpBottomNav active="events" />
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
