import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Clock } from 'lucide-react';

export default function NpReviewDetail() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          {/* Header */}
          <div style={{ padding: '52px 18px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="back-btn" onClick={() => navigate('/np/approvals')}>
              <ChevronLeft size={18} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>Review event</h1>
          </div>

          <div style={{ padding: '0 18px' }}>
            {/* Warning banner */}
            <div className="review-banner">
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
                You're reviewing this event
              </p>
              <p style={{ fontSize: 12, color: '#92400E', opacity: 0.85 }}>
                It won't go live until you approve it.
              </p>
            </div>

            {/* Hero image */}
            <div style={{
              height: 180, borderRadius: 'var(--radius-md)', overflow: 'hidden',
              position: 'relative', marginBottom: 16,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg,#FF8C42 0%,#F5604A 30%,#2C4B6E 65%,#1A2F48 100%)',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)',
              }} />
            </div>

            {/* Title & nonprofit */}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
              Coastal Cleanup Wave 2
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Ocean Conservancy</span>
              <span style={{
                width: 14, height: 14, borderRadius: '50%', background: 'var(--blue)',
                color: 'white', fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>✓</span>
            </div>

            {/* Info grid */}
            <div className="review-info-grid" style={{ marginBottom: 16 }}>
              <div className="review-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Calendar size={13} color="var(--primary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Date & time</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Oct 24, 2024</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>9:00 AM – 1:00 PM</p>
              </div>
              <div className="review-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <MapPin size={13} color="var(--primary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Location</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Santa Monica Pier</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Los Angeles, CA</p>
              </div>
            </div>

            {/* Mission */}
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>The Mission</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>
              Join us for our second wave of coastal restoration this season. We are targeting critical nesting habitats that have been heavily impacted by recent storms and debris accumulation. Your participation helps ensure a safe environment for local wildlife and preserves the natural beauty of our coastline for future generations. All equipment provided.
            </p>

            {/* Organizer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F5604A,#FF8A65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>MR</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 1 }}>Organized by</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Maya R.</p>
              </div>
              <button className="follow-btn">Follow</button>
            </div>

            {/* No activity yet */}
            <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
              }}>
                <Clock size={20} color="var(--text-light)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>No activity yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Updates and volunteer check-ins will appear here once the event is live.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky review bar */}
        <div className="review-bar">
          <div className="review-bar-row">
            <button
              className="review-bar-outline"
              onClick={() => navigate('/np/approvals/request-changes')}
            >
              Request changes
            </button>
            <button
              className="review-bar-approve"
              onClick={() => navigate('/np/approvals')}
            >
              Approve
            </button>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: 12 }}>
            <button
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => navigate('/np/approvals')}
            >
              Reject event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
