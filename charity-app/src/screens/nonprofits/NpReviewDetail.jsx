import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';

const HERO_IMG = '/events/breakneck-ridge-run/img1.jpg';

export default function NpReviewDetail() {
  const navigate = useNavigate();

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
              <img src={HERO_IMG} alt="Coastal Cleanup Wave 2"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              Coastal Cleanup Wave 2
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Ocean Conservancy</span>
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
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Oct 24, 2024</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>9:00 AM – 1:00 PM</p>
              </div>
              <div className="review-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <MapPin size={13} color="var(--blue)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Location</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Santa Monica Pier</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Los Angeles, CA</p>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>The Mission</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>
              Join us for our second wave of coastal restoration this season. We are targeting 500lbs of plastic and debris removed from Santa Monica&apos;s shoreline. Volunteers of all ages are welcome — gloves, bags, and refreshments provided.
            </p>
          </div>
        </div>

        <div className="review-bar">
          <div className="review-bar-row">
            <button
              type="button"
              className="review-bar-outline"
              onClick={() => navigate('/np/approvals/request-changes')}
            >
              Request changes
            </button>
            <button
              type="button"
              className="review-bar-approve"
              onClick={() => navigate('/np/approvals')}
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
