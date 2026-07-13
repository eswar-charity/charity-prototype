import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Users } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';
import GuestBottomNav from '../../components/GuestBottomNav';
import { getCausesWithEvents } from '../../data/marketingPages';
import { EventImageBanner } from '../../components/event/EventImage';

function formatRaised(value) {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
}

export default function Causes() {
  const navigate = useNavigate();
  const causes = getCausesWithEvents();

  return (
    <div className="phone-shell">
      <div className="screen info-page-screen">
        <MobileAppHeader
          layout="bar"
          homePath="/guest/feed"
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate('/guest/feed')}>
              <ChevronLeft size={18} />
            </button>
          )}
          title="Causes"
          subtitle="Browse events by what you care about"
        />

        <div className="screen-inner info-page-scroll">
          <section className="info-hero-card">
            <span className="info-eyebrow">The Scene</span>
            <h1 className="info-title">Find the cause that moves you.</h1>
            <p className="info-lead">
              Every event supports a verified nonprofit — from health runs to food-bank outings.
            </p>
          </section>

          {causes.map((cause) => (
            <article key={cause.category} className="info-cause-card">
              <EventImageBanner src={cause.featured?.cover} alt={cause.featured?.title || cause.category} variant="card" className="info-cause-hero">
                <span className="info-cause-badge">{cause.category}</span>
              </EventImageBanner>
              <div className="info-cause-body">
                <h3 className="info-cause-title">{cause.category}</h3>
                <p className="info-cause-desc">{cause.description}</p>
                {cause.featured && (
                  <p className="info-cause-featured">Featured: {cause.featured.title}</p>
                )}
                <div className="info-cause-meta">
                  <span><Users size={12} /> {cause.featured?.backed || 0} backing</span>
                  <span>{formatRaised(cause.totalRaised)} raised</span>
                </div>
                <button
                  type="button"
                  className="info-cause-btn"
                  onClick={() => navigate(`/guest/feed?cause=${encodeURIComponent(cause.category)}`)}
                >
                  View events <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <GuestBottomNav active="discover" />
      </div>
    </div>
  );
}
