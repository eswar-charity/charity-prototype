import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import { getCausesWithEvents } from '../../data/marketingPages';

function formatRaised(value) {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
}

export default function DesktopCauses() {
  const navigate = useNavigate();
  const causes = getCausesWithEvents();
  const totalEvents = causes.reduce((sum, c) => sum + c.eventCount, 0);
  const totalRaised = causes.reduce((sum, c) => sum + c.totalRaised, 0);

  const openCause = (category) => {
    navigate(`/guest/feed?cause=${encodeURIComponent(category)}`);
  };

  return (
    <div className="dsk-page dsk-info-page">
      <DesktopHeader active="Causes" homePath="/guest/feed" />

      <main className="dsk-main">
        <section className="dsk-info-hero dsk-info-hero--blue">
          <div className="dsk-container dsk-info-hero-inner">
            <span className="dsk-info-eyebrow">Causes on Charity Hub</span>
            <h1 className="dsk-info-title">Find the cause that moves you.</h1>
            <p className="dsk-info-lead">
              Every gathering on The Scene supports a verified nonprofit — from neon night runs
              to coastal clean-ups. Browse by cause and back what matters to your community.
            </p>
            <div className="dsk-info-stats-row">
              <div className="dsk-info-stat">
                <span className="dsk-info-stat-num">{causes.length}</span>
                <span className="dsk-info-stat-lbl">Active causes</span>
              </div>
              <div className="dsk-info-stat">
                <span className="dsk-info-stat-num">{totalEvents}</span>
                <span className="dsk-info-stat-lbl">Live &amp; upcoming events</span>
              </div>
              <div className="dsk-info-stat">
                <span className="dsk-info-stat-num">{formatRaised(totalRaised)}</span>
                <span className="dsk-info-stat-lbl">Raised across The Scene</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dsk-info-section">
          <div className="dsk-container">
            <div className="dsk-info-section-head">
              <h2 className="dsk-info-h2">Explore by cause</h2>
              <p className="dsk-info-sub">
                Tap a cause to see matching events on The Scene — live now or coming soon.
              </p>
            </div>
            <div className="dsk-causes-grid">
              {causes.map((cause) => (
                <article key={cause.category} className="dsk-cause-card">
                  <div
                    className="dsk-cause-card-hero"
                    style={{ backgroundImage: `url(${cause.featured?.cover})` }}
                  >
                    <span className="dsk-cause-badge">{cause.category}</span>
                    {cause.featured?.isLive && (
                      <span className="dsk-cause-live">
                        <span className="live-dot" /> LIVE
                      </span>
                    )}
                  </div>
                  <div className="dsk-cause-card-body">
                    <h3 className="dsk-cause-title">{cause.category}</h3>
                    <p className="dsk-cause-desc">{cause.description}</p>
                    {cause.featured && (
                      <p className="dsk-cause-featured">
                        Featured: <strong>{cause.featured.title}</strong>
                      </p>
                    )}
                    <div className="dsk-cause-meta">
                      <span><Users size={13} /> {cause.featured?.backed || 0} backing</span>
                      <span>{formatRaised(cause.totalRaised)} raised</span>
                    </div>
                    <button type="button" className="dsk-info-link-btn" onClick={() => openCause(cause.category)}>
                      View {cause.category} events
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dsk-info-cta-band">
          <div className="dsk-container dsk-info-cta-inner">
            <h2 className="dsk-info-cta-title">Do not see your cause?</h2>
            <p className="dsk-info-cta-sub">
              Host an event for any verified nonprofit — your story can open a brand-new cause lane on The Scene.
            </p>
            <button type="button" className="dsk-cta-btn dsk-info-cta-btn" onClick={() => navigate('/')}>
              Start an event
            </button>
          </div>
        </section>
      </main>

      <DesktopFooter />
    </div>
  );
}
