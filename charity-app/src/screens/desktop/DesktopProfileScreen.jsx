import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, Share2 } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import { eventDetailPath } from '../../utils/eventPaths';
import { EventImageBanner } from '../../components/event/EventImage';
import { useSeProfile } from '../../hooks/useSeProfile';
import { initialsFromName } from '../../utils/initials';

const DEFAULT_BIO = 'Creating events that bring communities together for causes that matter.';

export default function DesktopProfileScreen() {
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const { profile, hostedEvents, stats, loading, error, reload } = useSeProfile();

  const name = profile?.name ?? 'Profile';
  const initials = initialsFromName(name, profile?.initials ?? '?');
  const city = profile?.city;
  const bio = profile?.bio || DEFAULT_BIO;
  const cover = hostedEvents[0]?.photos?.[1] || hostedEvents[0]?.cover;
  const hasCover = Boolean(cover);

  return (
    <div className="dsk-page">
      <DesktopHeader
        active="Discover"
        loggedIn
        homePath="/feed"
        avatarInitials={initials}
      />

      {hasCover && (
        <EventImageBanner src={cover} alt="" variant="profile-cover" className="dsk-profile-cover" />
      )}

      <main className="dsk-main">
        <div className="dsk-container">
          {loading && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading profile…</div>
          )}
          {error && !profile && (
            <div className="discovery-empty" role="alert">
              <p className="discovery-empty-title">Couldn&apos;t load profile</p>
              <p className="discovery-empty-copy">{error.message || 'Something went wrong.'}</p>
              <button type="button" className="dsk-btn-primary" style={{ marginTop: 12 }} onClick={reload}>
                Try again
              </button>
            </div>
          )}
          {profile && (
            <>
              <div className={`dsk-profile-card${hasCover ? ' dsk-profile-card--over-cover' : ''}`}>
                <div className="dsk-profile-avatar">{initials}</div>
                <div className="dsk-profile-info">
                  <p className="dsk-profile-role">Social Entrepreneur · Charity Hub</p>
                  <h1 className="dsk-profile-name">{name}</h1>
                  {city && (
                    <p className="dsk-profile-loc"><MapPin size={13} /> {city}</p>
                  )}
                  <p className="dsk-profile-bio">{bio}</p>
                </div>
                <div className="dsk-profile-actions">
                  <button type="button" className="dsk-msg-btn" onClick={() => navigate('/about-you')}>
                    <Pencil size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                    Edit profile
                  </button>
                  <button type="button" className="dsk-follow-cta" onClick={() => setShowShare(true)}>
                    <Share2 size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                    Share
                  </button>
                </div>
              </div>

              <div className="dsk-profile-stats-row">
                <div className="dsk-profile-stat">
                  <span className="dsk-profile-stat-num">{stats.eventsHosted}</span>
                  <span className="dsk-profile-stat-lbl">Events hosted</span>
                </div>
                <div className="dsk-profile-stat">
                  <span className="dsk-profile-stat-num">{stats.peopleReached}</span>
                  <span className="dsk-profile-stat-lbl">People reached</span>
                </div>
                <div className="dsk-profile-stat">
                  <span className="dsk-profile-stat-num">${Math.round(stats.raised / 1000)}k</span>
                  <span className="dsk-profile-stat-lbl">Raised</span>
                </div>
              </div>

              <div className="dsk-profile-events-head">
                <p className="dsk-panel-title">Your events</p>
              </div>

              {hostedEvents.length === 0 ? (
                <p className="dsk-empty-note">No events yet — create your first event from the feed.</p>
              ) : (
                <div className="dsk-profile-event-grid">
                  {hostedEvents.map((ev) => (
                    <button
                      key={ev.id ?? ev.key}
                      type="button"
                      className="dsk-profile-event-card"
                      onClick={() => navigate(eventDetailPath(ev, { loggedIn: true }))}
                    >
                      <EventImageBanner src={ev.cover} alt={ev.title} variant="profile-tile" className="dsk-profile-event-hero">
                        {ev.isLive && (
                          <span className="dsk-badge-live"><span className="live-dot" /> LIVE NOW</span>
                        )}
                      </EventImageBanner>
                      <div className="dsk-profile-event-body">
                        <p className="dsk-profile-event-title">{ev.title}</p>
                        <p className="dsk-profile-event-np">for {ev.nonprofit}</p>
                        <p className="dsk-profile-event-stat">{ev.backed} backing</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <DesktopFooter />

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={`${window.location.origin}/profile`}
          title={name}
          subtitle="Event Presenter · Charity Hub"
        />
      )}
    </div>
  );
}
