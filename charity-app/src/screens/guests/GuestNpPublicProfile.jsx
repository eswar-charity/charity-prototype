import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';
import { EventImageBanner } from '../../components/event/EventImage';
import { eventDisplayTitle } from '../../utils/eventDisplay';
import { eventDetailPath } from '../../utils/eventPaths';
import { useNonprofitProfile } from '../../hooks/useNonprofitProfile';
import useIsDesktop from '../../hooks/useIsDesktop';
import DesktopNpPublicProfile from './desktop/DesktopNpPublicProfile';

function formatRaised(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString()}`;
}

function MobileNpPublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { profile, loading, error } = useNonprofitProfile(slug, true);

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, color: 'var(--text-secondary)' }}>
          Loading nonprofit…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24 }}>
          <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <p style={{ marginTop: 24, fontWeight: 700, color: 'var(--dark)' }}>Nonprofit not found</p>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            {error?.message || 'We couldn’t load this profile.'}
          </p>
        </div>
      </div>
    );
  }

  const cover = profile.events[0]?.cover;

  return (
    <div className="phone-shell">
      <div className="screen">
        <div className="detail-scroll" style={{ paddingBottom: 32 }}>
          {cover ? (
            <EventImageBanner src={cover} alt="" variant="hero" className="detail-hero" style={{ height: 160 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 60%)' }} />
              <button
                type="button"
                className="back-btn"
                aria-label="Back"
                style={{ position: 'absolute', top: 48, left: 16, background: 'rgba(255,255,255,0.2)', border: 'none' }}
                onClick={() => navigate(-1)}
              >
                <ChevronLeft size={18} color="white" />
              </button>
            </EventImageBanner>
          ) : (
            <div style={{ padding: '48px 18px 0' }}>
              <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
            </div>
          )}

          <div style={{ padding: '0 18px', marginTop: cover ? -28 : 12, position: 'relative' }}>
            <div className="card" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: profile.bg || 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 18, marginBottom: 12,
              }}
              >
                {profile.initials}
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {profile.category} · Verified 501(c)(3) ✓
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{profile.name}</h1>
              {profile.ein && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>EIN {profile.ein}</p>
              )}
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {profile.mission || 'A verified nonprofit partner on Charity Hub.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
              <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>{profile.stats.eventsHosted}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Events</p>
              </div>
              <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>{profile.stats.totalBacked.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Backers</p>
              </div>
              <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>{formatRaised(profile.stats.totalRaised)}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Raised</p>
              </div>
            </div>

            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>
              Events benefiting {profile.name}
            </p>

            {profile.events.length === 0 && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No public events yet.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.events.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="card"
                  style={{ padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                  onClick={() => navigate(eventDetailPath(e, { loggedIn: false }))}
                >
                  <EventImageBanner src={e.cover} alt={e.title} variant="card" style={{ height: 120 }}>
                    {e.isLive && (
                      <span className="live-badge" style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span className="live-dot" /> LIVE NOW
                      </span>
                    )}
                  </EventImageBanner>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
                      {eventDisplayTitle(e.title)}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Users size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                      {e.backed} backing · {e.joined} attending
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestNpPublicProfileRoute() {
  return useIsDesktop() ? <DesktopNpPublicProfile /> : <MobileNpPublicProfile />;
}
