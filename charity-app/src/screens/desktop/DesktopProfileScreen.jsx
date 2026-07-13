import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, Share2 } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import { events, SE_ORGANIZER, getOrganizerProfile, slugify, eventDetailPath } from '../../data/mockData';
import { EventImageBanner } from '../../components/event/EventImage';

const profile = getOrganizerProfile(slugify(SE_ORGANIZER.name));
const HOSTED_EVENTS = profile?.events ?? events;
const COVER = HOSTED_EVENTS[0]?.photos?.[1] || HOSTED_EVENTS[0]?.cover;

export default function DesktopProfileScreen() {
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" />

      <EventImageBanner src={COVER} alt="" variant="profile-cover" className="dsk-profile-cover" />

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-profile-card">
            <div className="dsk-profile-avatar">{SE_ORGANIZER.initials}</div>
            <div className="dsk-profile-info">
              <p className="dsk-profile-role">Social Entrepreneur · Charity Hub</p>
              <h1 className="dsk-profile-name">{SE_ORGANIZER.name}</h1>
              <p className="dsk-profile-loc"><MapPin size={13} /> San Francisco, CA</p>
              <p className="dsk-profile-bio">
                Creating events that bring communities together for causes that matter.
              </p>
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
              <span className="dsk-profile-stat-num">{HOSTED_EVENTS.length}</span>
              <span className="dsk-profile-stat-lbl">Events hosted</span>
            </div>
            <div className="dsk-profile-stat">
              <span className="dsk-profile-stat-num">{profile?.stats.peopleReached ?? 0}</span>
              <span className="dsk-profile-stat-lbl">People reached</span>
            </div>
            <div className="dsk-profile-stat">
              <span className="dsk-profile-stat-num">${Math.round((profile?.stats.raised ?? 0) / 1000)}k</span>
              <span className="dsk-profile-stat-lbl">Raised</span>
            </div>
          </div>

          <div className="dsk-profile-events-head">
            <p className="dsk-panel-title">Your events</p>
          </div>

          <div className="dsk-profile-event-grid">
            {HOSTED_EVENTS.map((ev) => (
              <button
                key={ev.id}
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
        </div>
      </main>

      <DesktopFooter />

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={`${window.location.origin}/profile`}
          title={SE_ORGANIZER.name}
          subtitle="Event Presenter · Charity Hub"
        />
      )}
    </div>
  );
}
