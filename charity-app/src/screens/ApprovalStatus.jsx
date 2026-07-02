import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock } from 'lucide-react';

export default function ApprovalStatus() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '52px 18px 0' }}>
          <button className="back-btn" onClick={() => navigate('/event/step-4')} style={{ marginBottom: 24 }}>
            <ChevronLeft size={18} />
          </button>

          {/* Submitted card */}
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 20 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Clock size={24} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Submitted!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ocean Conservancy is reviewing your event. You'll hear back within 48 hours.
            </p>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: '18px 18px', marginBottom: 20 }}>
            {/* Step 1 - done */}
            <div className="timeline-step">
              <div className="timeline-dot td-done">
                <Check size={12} strokeWidth={3} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Submitted</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Today, 2:34 PM</p>
              </div>
            </div>
            <div className="timeline-connector" />

            {/* Step 2 - active */}
            <div className="timeline-step">
              <div className="timeline-dot td-active">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>Nonprofit review</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Ocean Conservancy is reviewing</p>
              </div>
            </div>
            <div className="timeline-connector" />

            {/* Step 3 - pending */}
            <div className="timeline-step">
              <div className="timeline-dot td-pending" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Goes live</p>
                <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>After approval it auto-publishes</p>
              </div>
            </div>
          </div>

          {/* Event image card */}
          <div style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            height: 140,
            background: 'linear-gradient(160deg, #FF8C00 0%, #F5604A 50%, #E05C20 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            marginBottom: 24,
          }}>
            {/* Simulated people silhouettes */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
            }} />
            <p style={{
              position: 'relative',
              color: 'white',
              fontSize: 17,
              fontWeight: 800,
              padding: '0 14px 14px',
            }}>
              Coastal Cleanup Drive
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" onClick={() => navigate('/live-dashboard')}>
              Notify me when approved
            </button>
            <button className="btn-outline" onClick={() => navigate('/event/step-4')}>
              Edit event
            </button>
            <button
              className="btn-ghost"
              style={{ textAlign: 'center', marginTop: 4 }}
              onClick={() => navigate('/live-dashboard')}
            >
              View my events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
