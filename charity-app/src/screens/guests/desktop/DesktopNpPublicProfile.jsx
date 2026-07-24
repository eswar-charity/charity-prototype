import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopFooter from '../../../components/desktop/DesktopFooter';
import { eventDisplayTitle } from '../../../data/mockData';
import { eventDetailPath } from '../../../utils/eventPaths';
import { getNonprofit } from '../../../api/nonprofits';
import { adaptNonprofitProfile } from '../../../api/adapters/nonprofit';
import { EventImageBanner } from '../../../components/event/EventImage';

function enrichProfileEvent(ev) {
  return {
    ...ev,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
  };
}

export default function DesktopNpPublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setProfile(null);
      setLoading(false);
      setError(new Error('Missing nonprofit slug'));
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNonprofit(slug)
      .then((raw) => {
        if (cancelled) return;
        const adapted = adaptNonprofitProfile(raw);
        setProfile({
          ...adapted,
          events: (adapted.events ?? []).map(enrichProfileEvent),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setProfile(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading nonprofit…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '60px 0', textAlign: 'center' }}>
            <p className="dsk-page-subtitle">We couldn&apos;t find that nonprofit profile.</p>
            {error?.message && (
              <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{error.message}</p>
            )}
            <button className="dsk-card-cta primary" style={{ marginTop: 16 }} onClick={() => navigate('/guest/feed')}>
              Back to Discover
            </button>
          </div>
        </main>
      </div>
    );
  }

  const cover = profile.events[0]?.photos?.[0] || profile.events[0]?.cover;

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      {cover && <EventImageBanner src={cover} alt="" variant="profile-cover" className="dsk-profile-cover" />}

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-profile-card">
            <div className="dsk-profile-avatar" style={{ background: profile.bg }}>{profile.initials}</div>
            <div className="dsk-profile-info">
              <p className="dsk-profile-role">
                {profile.category} · Verified 501(c)(3)
                <span className="dsk-verify-dot" style={{ marginLeft: 6 }}>✓</span>
              </p>
              <h1 className="dsk-profile-name">{profile.name}</h1>
              <p className="dsk-profile-bio">{profile.mission}</p>
            </div>
          </div>

          <div className="dsk-profile-stats-row">
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">{profile.stats.eventsHosted}</span><span className="dsk-profile-stat-lbl">Events hosted</span></div>
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">{profile.stats.totalBacked.toLocaleString()}</span><span className="dsk-profile-stat-lbl">Backers</span></div>
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">${Math.round(profile.stats.totalRaised / 1000)}k</span><span className="dsk-profile-stat-lbl">Raised</span></div>
          </div>

          <div className="dsk-profile-events-head">
            <p className="dsk-panel-title">Events benefiting {profile.name}</p>
          </div>

          <div className="dsk-profile-event-grid">
            {profile.events.length === 0 && (
              <p className="dsk-empty-note">No events yet.</p>
            )}
            {profile.events.map((e) => (
              <div
                key={e.id}
                className="dsk-profile-event-card"
                role="button"
                tabIndex={0}
                aria-label={`View ${e.title.replace(/\s+/g, '')}`}
                onClick={() => navigate(eventDetailPath(e, { loggedIn: false }))}
                onKeyDown={(evt) => {
                  if (evt.key === 'Enter' || evt.key === ' ') {
                    evt.preventDefault();
                    navigate(eventDetailPath(e, { loggedIn: false }));
                  }
                }}
              >
                <EventImageBanner src={e.cover} alt={e.title} variant="profile-tile" className="dsk-profile-event-hero">
                  {e.isLive && <span className="dsk-badge-live"><span className="live-dot" /> LIVE NOW</span>}
                </EventImageBanner>
                <div className="dsk-profile-event-body">
                  <p className="dsk-profile-event-title">{eventDisplayTitle(e.title)}</p>
                  <p className="dsk-profile-event-np"><Users size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />{e.backed} backing</p>
                  <p className="dsk-profile-event-stat">{e.joined} attending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <DesktopFooter />
    </div>
  );
}
