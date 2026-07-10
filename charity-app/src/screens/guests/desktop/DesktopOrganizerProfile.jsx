import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Share2 } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopFooter from '../../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import { getOrganizerProfile } from '../../../data/mockData';

const EVENT_TABS = ['Live', 'Upcoming', 'Past'];

export default function DesktopOrganizerProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [eventTab, setEventTab] = useState('Live');
  const [showShare, setShowShare] = useState(false);

  const profile = getOrganizerProfile(slug);

  if (!profile) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '60px 0', textAlign: 'center' }}>
            <p className="dsk-page-subtitle">We couldn't find that organiser profile.</p>
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

      <div className="dsk-profile-cover" style={{ backgroundImage: `url(${profile.events[0]?.photos?.[4] || profile.events[0]?.cover})` }} />

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-profile-card">
            <div className="dsk-profile-avatar">{profile.initials}</div>
            <div className="dsk-profile-info">
              <p className="dsk-profile-role">Event Presenter · Charity Hub</p>
              <h1 className="dsk-profile-name">{profile.name}</h1>
              <p className="dsk-profile-loc"><MapPin size={13} /> {profile.location}</p>
              <p className="dsk-profile-bio">{profile.bio}</p>
              <div className="dsk-profile-causes">
                {profile.causes.map((c) => <span key={c} className="dsk-cause-tag">{c}</span>)}
              </div>
            </div>
            <div className="dsk-profile-actions">
              <button className="dsk-msg-btn" onClick={() => navigate('/guest/join')}>Message</button>
              <button className={`dsk-follow-cta ${following ? 'active' : ''}`} onClick={() => setFollowing((f) => !f)}>
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
                <span key={t} className={`dsk-profile-event-tab ${eventTab === t ? 'active' : ''}`} onClick={() => setEventTab(t)}>{t}</span>
              ))}
            </div>
          </div>

          <div className="dsk-profile-event-grid">
            {shownEvents.length === 0 && (
              <p className="dsk-empty-note">No {eventTab.toLowerCase()} events yet.</p>
            )}
            {shownEvents.map((e) => (
              <div key={e.id} className="dsk-profile-event-card" onClick={() => navigate(e.isLive ? '/guest/event/live' : '/guest/event/upcoming')}>
                <div className="dsk-profile-event-hero" style={{ backgroundImage: `url(${e.cover})` }}>
                  {e.isLive && <span className="dsk-badge-live"><span className="live-dot" /> LIVE NOW</span>}
                </div>
                <div className="dsk-profile-event-body">
                  <p className="dsk-profile-event-title">#{e.title.replace(/\s+/g, '')}</p>
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
          previewStyle={{
            backgroundImage: `url(${profile.events[0]?.photos?.[4] || profile.events[0]?.cover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <DesktopFooter />
    </div>
  );
}
