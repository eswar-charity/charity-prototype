import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Share2 } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopFooter from '../../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import DesktopJoinGateModal from '../../../components/desktop/DesktopJoinGateModal';
import { slugify, eventDisplayTitle } from '../../../utils/eventDisplay';
import { eventDetailPath } from '../../../utils/eventPaths';
import { listEvents } from '../../../api/events';
import { getOrganizer } from '../../../api/users';
import { adaptEvent } from '../../../api/adapters/event';
import { EventImageBanner } from '../../../components/event/EventImage';
import { useAuth } from '../../../auth/AuthContext';

const EVENT_TABS = ['Live', 'Upcoming', 'Past'];

function enrichProfileEvent(ev) {
  return {
    ...ev,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
  };
}

function initialsFromName(name) {
  if (!name) return 'SE';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Derive the organizer from the public event feed (filtered by name slug);
 * personal details are layered on from GET /organizers/{id}.
 */
function buildOrganizerProfile(slug, events) {
  const hosted = events.filter(
    (e) =>
      slugify(e.organizer) === slug ||
      (e.organizerBrief?.name && slugify(e.organizerBrief.name) === slug),
  );
  if (hosted.length === 0) return null;

  const brief = hosted[0].organizerBrief;
  const name = brief?.name || hosted[0].organizer;
  return {
    slug,
    name,
    initials: brief?.initials || initialsFromName(name),
    role: 'Event Presenter · Charity Hub',
    organizerId: brief?.id ?? null,
    // Filled from GET /organizers/{id}; empty until the organizer writes them.
    location: '',
    bio: '',
    causes: [...new Set(hosted.map((e) => e.category).filter(Boolean))],
    stats: {
      eventsHosted: hosted.length,
      peopleReached: hosted.reduce((sum, e) => sum + (e.joined || 0), 0),
      raised: hosted.reduce((sum, e) => sum + (e.raised || 0), 0),
    },
    events: hosted,
  };
}

export default function DesktopOrganizerProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(false);
  const [eventTab, setEventTab] = useState('Live');
  const [showShare, setShowShare] = useState(false);
  const [showJoinGate, setShowJoinGate] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFollow = () => {
    if (isAuthenticated) {
      setFollowing((f) => !f);
      return;
    }
    setShowJoinGate(true);
  };

  useEffect(() => {
    if (!slug) {
      setProfile(null);
      setLoading(false);
      setError(new Error('Missing organiser slug'));
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Events come from the public feed; bio/city come from GET /organizers/{id}.
    listEvents({ page: 1, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const adapted = (res.items ?? []).map((raw) => enrichProfileEvent(adaptEvent(raw)));
        const base = buildOrganizerProfile(slug, adapted);
        if (!base?.organizerId) return base;
        return getOrganizer(base.organizerId)
          .then((org) => ({
            ...base,
            location: org.city || '',
            bio: org.bio || '',
            causes: org.causes?.length ? org.causes : base.causes,
          }))
          .catch(() => base);
      })
      .then((built) => {
        if (!cancelled) setProfile(built);
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
        <DesktopHeader active="Discover" loggedIn />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading organiser…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '60px 0', textAlign: 'center' }}>
            <p className="dsk-page-subtitle">We couldn&apos;t find that organiser profile.</p>
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

  const shownEvents = profile.events.filter((e) =>
    eventTab === 'Live' ? e.isLive : eventTab === 'Upcoming' ? !e.isLive : false
  );

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn avatarInitials={profile.initials} />

      <div className="dsk-profile-banner">
        <EventImageBanner
          src={profile.events[0]?.photos?.[4] || profile.events[0]?.cover}
          alt=""
          variant="profile-cover"
          className="dsk-profile-cover"
        />
      </div>

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-profile-card dsk-profile-card--over-cover">
            <div className="dsk-profile-avatar">{profile.initials}</div>
            <div className="dsk-profile-info">
              <p className="dsk-profile-role">Event Presenter · Charity Hub</p>
              <h1 className="dsk-profile-name">{profile.name}</h1>
              {profile.location && <p className="dsk-profile-loc"><MapPin size={13} /> {profile.location}</p>}
              {profile.bio && <p className="dsk-profile-bio">{profile.bio}</p>}
              <div className="dsk-profile-causes">
                {profile.causes.map((c) => <span key={c} className="dsk-cause-tag">{c}</span>)}
              </div>
            </div>
            <div className="dsk-profile-actions">
              <button className="dsk-msg-btn" onClick={() => setShowJoinGate(true)}>Message</button>
              <button className={`dsk-follow-cta ${following ? 'active' : ''}`} onClick={handleFollow}>
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <div className="dsk-profile-stats-row">
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">{profile.stats.eventsHosted}</span><span className="dsk-profile-stat-lbl">Events hosted</span></div>
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">{profile.stats.peopleReached.toLocaleString()}</span><span className="dsk-profile-stat-lbl">People reached</span></div>
            <div className="dsk-profile-stat"><span className="dsk-profile-stat-num">${Math.round(profile.stats.raised / 1000)}k</span><span className="dsk-profile-stat-lbl">Raised</span></div>
          </div>

          <div className="dsk-official-banner">
            <div>
              <p className="dsk-official-title">Official event organiser</p>
              <p className="dsk-official-sub">Verified by Charity Hub</p>
            </div>
            <button
              className="dsk-linkedin-btn"
              onClick={() => setShowShare(true)}
            >
              <Share2 size={14} /> Share to LinkedIn
            </button>
          </div>

          <div className="dsk-profile-events-head">
            <p className="dsk-panel-title">Events by {profile.name}</p>
            <div className="dsk-profile-event-tabs">
              {EVENT_TABS.map((t) => (
                <span
                  key={t}
                  className={`dsk-profile-event-tab ${eventTab === t ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${t} events`}
                  aria-pressed={eventTab === t}
                  onClick={() => setEventTab(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEventTab(t);
                    }
                  }}
                >{t}</span>
              ))}
            </div>
          </div>

          <div className="dsk-profile-event-grid">
            {shownEvents.length === 0 && (
              <p className="dsk-empty-note">No {eventTab.toLowerCase()} events yet.</p>
            )}
            {shownEvents.map((e) => (
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
                  <p className="dsk-profile-event-np">for {e.nonprofit}</p>
                  <p className="dsk-profile-event-stat">{e.joined} attending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showShare && profile && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={`https://charity.hub/organizer/${slug}`}
          title={profile.name}
          subtitle="Event Presenter · Charity Hub"
          heading="Share profile"
          previewSrc={profile.events[0]?.photos?.[4] || profile.events[0]?.cover}
        />
      )}

      {showJoinGate && (
        <DesktopJoinGateModal
          open={showJoinGate}
          onClose={() => setShowJoinGate(false)}
          eventTitle={profile?.name || 'this organiser'}
          nonprofit="Charity Hub organiser"
          npInitials={profile?.initials || 'SE'}
          intent="follow"
        />
      )}

      <DesktopFooter />
    </div>
  );
}
