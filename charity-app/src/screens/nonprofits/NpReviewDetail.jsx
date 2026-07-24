import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';
import { useNpReviewDetail } from '../../hooks/useNpApprovals';
import { npRequestChangesPath } from '../../utils/npApprovalAdapter';

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

export default function NpReviewDetail() {
  const navigate = useNavigate();
  const { event, eventId, loading, error, approve, reject } = useNpReviewDetail();
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const handleApprove = async () => {
    try {
      await approve();
      notify(`“${event?.title ?? 'Event'}” approved & published`);
      navigate('/np/approvals');
    } catch {
      notify('Could not approve event');
    }
  };

  const handleReject = async () => {
    try {
      await reject();
      notify(`“${event?.title ?? 'Event'}” rejected`);
      navigate('/np/approvals');
    } catch {
      notify('Could not reject event');
    }
  };

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load event'}
        </div>
      </div>
    );
  }

  const heroImg = event.cover || '/events/give-now/img1.jpg';
  const nonprofitName = event.nonprofit || event.nonprofitBrief?.name || 'Your organization';
  const timeLabel = [event.startTime, event.endTime].filter(Boolean).join(' – ');

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          <MobileAppHeader
            layout="bar"
            homePath="/np/home"
            left={(
              <button type="button" className="back-btn" onClick={() => navigate('/np/approvals')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
            )}
          />
          <div className="np-page-title-wrap" style={{ paddingBottom: 8 }}>
            <h1 className="np-page-title" style={{ fontSize: 22 }}>Review event</h1>
          </div>

          <div style={{ padding: '0 18px 24px' }}>
            <div className="review-banner">
              <p className="review-banner-title">You&apos;re reviewing this event</p>
              <p className="review-banner-sub">It won&apos;t go live until you approve it.</p>
            </div>

            <div style={{
              height: 200, borderRadius: 'var(--radius-md)', overflow: 'hidden',
              position: 'relative', marginBottom: 16,
            }}>
              <img src={heroImg} alt={event.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              {event.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{nonprofitName}</span>
              <span style={{
                width: 14, height: 14, borderRadius: '50%', background: 'var(--blue)',
                color: 'white', fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>✓</span>
            </div>

            <div className="review-info-grid">
              <div className="review-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Calendar size={13} color="var(--blue)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Date & time</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{event.date || '—'}</p>
                {timeLabel && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{timeLabel}</p>
                )}
              </div>
              <div className="review-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <MapPin size={13} color="var(--blue)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Location</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{event.location || '—'}</p>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>The Mission</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>
              {event.mission || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="review-bar">
          <div className="review-bar-row">
            <button
              type="button"
              className="review-bar-outline"
              onClick={() => navigate(npRequestChangesPath(eventId))}
            >
              Request changes
            </button>
            <button
              type="button"
              className="review-bar-approve"
              onClick={handleApprove}
            >
              Approve
            </button>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <button
              type="button"
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={handleReject}
            >
              Reject event
            </button>
          </div>
        </div>
        {toast && <div style={TOAST_STYLE}>{toast}</div>}
      </div>
    </div>
  );
}
