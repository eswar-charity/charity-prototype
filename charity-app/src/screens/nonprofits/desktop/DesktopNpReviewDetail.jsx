import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tag, Check } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const HERO_IMG = '/events/breakneck-ridge-run/img1.jpg';
const SUBMITTER_AVATAR = '/events/breakneck-ridge-run/img4.jpg';

const CONTENT_CHECKS = [
  { id: 1, label: 'Media present', done: true },
  { id: 2, label: 'Story text', done: true },
  { id: 3, label: 'Policy scan', done: false },
];

export default function DesktopNpReviewDetail() {
  const navigate = useNavigate();

  return (
    <DesktopNpLayout active="approvals" title="Launchpad">
      <div className="dsk-np-review-banner">You're reviewing this event — it won't go live until you approve it</div>

      <div className="dsk-np-review-grid">
        <div className="dsk-np-review-main">
          <div className="dsk-np-review-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
            <div className="dsk-np-review-hero-tags">
              <span className="dsk-modal-tag" style={{ background: 'rgba(255,255,255,0.9)' }}>Environment</span>
              <span className="dsk-modal-tag" style={{ background: 'rgba(255,255,255,0.9)' }}>Volunteer</span>
            </div>
            <div className="dsk-np-review-hero-title">
              <h2>#CoastalCleanupWave2</h2>
              <p>for Ocean Conservancy · by Mike Rivera</p>
            </div>
          </div>

          <div className="dsk-np-review-section">
            <p className="dsk-np-review-section-title">The Mission</p>
            <p className="dsk-np-review-section-text">
              Our coastline is our community's front yard. Join us for a sunset cleanup session focused on removing
              microplastics and fishing line debris from Santa Monica's sensitive intertidal zones.
            </p>
            <button
              type="button"
              className="dsk-cta-btn"
              style={{ marginTop: 4 }}
              onClick={() => navigate('/guest/event/upcoming')}
            >
              Join the Crew
            </button>
          </div>

          <div className="dsk-np-review-section">
            <p className="dsk-np-review-section-title">The Story</p>
            <p className="dsk-np-review-section-text">
              Join us for our second wave of coastal restoration this season. We are targeting 500lbs of plastic and
              debris removed from Santa Monica's shoreline. Volunteers of all ages are welcome — gloves, bags, and
              refreshments provided.
            </p>
          </div>
        </div>

        <aside className="dsk-np-review-sidebar">
          <div className="dsk-sidebar-card">
            <div className="dsk-sidebar-np-row">
              <img src={SUBMITTER_AVATAR} alt="Mike Rivera" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p className="dsk-sidebar-np-name">Mike Rivera <span className="dsk-verify-dot">✓</span></p>
                <p className="dsk-sidebar-np-sub">3 events approved · Joined Mar 2024</p>
              </div>
            </div>
          </div>

          <div className="dsk-sidebar-card" style={{ marginTop: 14 }}>
            <p className="dsk-np-review-side-title">Event details</p>
            <div className="dsk-np-review-detail-row"><Calendar size={14} color="var(--blue)" /><div><p>Oct 28, 2025</p><span>9:00 AM – 1:00 PM</span></div></div>
            <div className="dsk-np-review-detail-row"><MapPin size={14} color="var(--blue)" /><div><p>Santa Monica Pier</p><span>Los Angeles, CA</span></div></div>
            <div className="dsk-np-review-detail-row"><Tag size={14} color="var(--blue)" /><div><p>Environment</p></div></div>
          </div>

          <div className="dsk-sidebar-card" style={{ marginTop: 14 }}>
            <p className="dsk-np-review-side-title">Content check</p>
            {CONTENT_CHECKS.map((c) => (
              <div key={c.id} className="dsk-np-content-check">
                <div className={`check-circle ${c.done ? 'checked' : ''}`}>{c.done && <Check size={12} strokeWidth={3} />}</div>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="dsk-np-review-bar">
        <button className="np-link-btn" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={() => navigate('/np/approvals')}>Reject event</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="review-bar-outline"
            style={{ flex: 'none', padding: '13px 22px' }}
            onClick={() => navigate('/np/approvals/request-changes')}
          >
            Request changes
          </button>
          <button
            className="review-bar-approve"
            style={{ flex: 'none', padding: '13px 22px' }}
            onClick={() => navigate('/np/approvals')}
          >
            Approve
          </button>
        </div>
      </div>
    </DesktopNpLayout>
  );
}
