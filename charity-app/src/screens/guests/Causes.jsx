import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Users } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';
import GuestBottomNav from '../../components/GuestBottomNav';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../auth/AuthContext';
import useCauses from '../../hooks/useCauses';
import { EventImageBanner } from '../../components/event/EventImage';

function formatRaised(value) {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
}

export default function Causes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? '/feed' : '/guest/feed';
  const { causes, loading } = useCauses();

  return (
    <div className="phone-shell">
      <div className="screen info-page-screen">
        <MobileAppHeader
          layout="bar"
          homePath={homePath}
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate(homePath)}>
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

          {!loading && causes.length === 0 && (
            <p className="info-lead" style={{ textAlign: 'center', padding: 24 }}>No causes have events yet.</p>
          )}

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
                  onClick={() => navigate(`${homePath}?cause=${encodeURIComponent(cause.category)}`)}
                >
                  View events <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {isAuthenticated
          ? <BottomNav onPlusClick={() => navigate('/event/step-1')} />
          : <GuestBottomNav active="discover" />}
      </div>
    </div>
  );
}
