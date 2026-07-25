import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Share2, Bookmark, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import DesktopJoinGateModal from '../../../components/desktop/DesktopJoinGateModal';
import { EventBackersModal } from '../../../components/event/EventModals';
import EventNonprofitLearnMore from '../../../components/event/EventNonprofitLearnMore';
import { slugify, eventDisplayTitle, getEventBannerFocus, getCommunityPhotos } from '../../../data/mockData';
import { EventImageBanner } from '../../../components/event/EventImage';
import { useAuth } from '../../../auth/AuthContext';
import { useEventDetail, useEventBackers, useEventActions } from '../../../hooks/useEventDetail';

const BACKER_COLORS = ['var(--primary)', 'var(--primary-hover)', '#5BB8F5', '#1A6EB5', 'var(--secondary-soft)'];

export default function DesktopEventDetailUpcoming({ loggedIn = false }) {
  const navigate = useNavigate();
  const { eventKey } = useParams();
  const { isAuthenticated } = useAuth();
  const { ev, loading, error } = useEventDetail(eventKey);
  const [following, setFollowing] = useState(false);
  const [backed, setBacked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showNpModal, setShowNpModal] = useState(false);
  const [showBackersModal, setShowBackersModal] = useState(false);
  const [showJoinGate, setShowJoinGate] = useState(false);
  const [gateIntent, setGateIntent] = useState('default');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const openGate = (intent = 'default') => {
    setGateIntent(intent);
    setShowJoinGate(true);
  };

  const handleFollow = () => {
    if (isAuthenticated || loggedIn) {
      setFollowing((f) => !f);
      return;
    }
    openGate('follow');
  };

  const { saved, handleSave } = useEventActions({
    ev,
    loggedIn,
    isAuthenticated,
    onNeedAuth: (intent) => openGate(intent || 'default'),
    showToast,
  });
  const { backers, loading: backersLoading } = useEventBackers(eventKey, showBackersModal, showToast);

  if (loading) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading event…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ fontWeight: 700, color: 'var(--dark)' }}>Couldn&apos;t load event</p>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{error?.message || 'Not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  const shareUrl = `https://charity.hub/event/${ev.key}`;

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />

      <EventImageBanner src={ev.cover} alt={ev.title} variant="hero" className="dsk-ev-hero" objectPosition={getEventBannerFocus(ev)}>
        <div className="dsk-ev-hero-gradient" />
        <div className="dsk-ev-hero-top">
          <span className="dsk-ev-hero-pill"><Calendar size={12} /> {ev.date} · {ev.startTime}</span>
          <div className="dsk-ev-hero-actions">
            <button className="ev-hero-btn" onClick={handleSave} aria-label="Save event">
              <Bookmark size={16} color="white" fill={saved ? 'white' : 'none'} />
            </button>
            <button className="ev-hero-btn" onClick={() => setShowShare(true)} aria-label="Share"><Share2 size={16} color="white" /></button>
          </div>
        </div>
        <div className="dsk-ev-hero-bottom">
          <h1 className="dsk-ev-hero-title">{eventDisplayTitle(ev.title)}</h1>
          <p className="dsk-ev-hero-sub">
            <MapPin size={12} style={{ verticalAlign: -1, marginRight: 4 }} aria-hidden="true" />{ev.location} · PRESENTED BY{' '}
            <span
              role="button"
              tabIndex={0}
              aria-label={`View ${ev.organizer}'s profile`}
              onClick={() => navigate(`/guest/organizer/${slugify(ev.organizer)}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/guest/organizer/${slugify(ev.organizer)}`);
                }
              }}
            >{ev.organizer}</span>
          </p>
        </div>
      </EventImageBanner>

      <main className="dsk-main">
        <div className="dsk-container dsk-ev-grid">
          <div className="dsk-ev-content">
            <div className="dsk-tab-panel">
              <div className="dsk-np-info-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div style={{ flex: 1 }}>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">Verified nonprofit</p>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => setShowNpModal(true)}
                >Learn more</button>
              </div>

              <div
                className="dsk-upcoming-backers-row"
                role="button"
                tabIndex={0}
                aria-label={`View ${ev.backed} people backing this event`}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowBackersModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowBackersModal(true);
                  }
                }}
              >
                <div className="av-stack">
                  {BACKER_COLORS.map((c, i) => <div key={i} className="av" style={{ background: c }} />)}
                </div>
                <span className="dsk-upcoming-backers-text">{ev.backed} people are backing this</span>
                <ChevronRight size={16} color="var(--text-light)" style={{ marginLeft: 'auto' }} />
              </div>

              <div className="dsk-upcoming-organiser-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.initials}</div>
                <div style={{ flex: 1 }}>
                  <p className="dsk-sidebar-np-name">{ev.organizer} <span className="dsk-verify-dot">✓</span></p>
                  <p className="dsk-sidebar-np-sub">Organiser</p>
                </div>
                <button
                  className="follow-btn"
                  style={following ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
                  onClick={handleFollow}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </div>

              <p className="dsk-panel-title" style={{ margin: '22px 0 10px' }}>The Mission</p>
              <p className="dsk-modal-section-text" style={{ fontSize: 14 }}>{ev.subtitle}</p>

              <div className="dsk-community-grid" style={{ marginTop: 20 }}>
                {getCommunityPhotos(ev).map((src) => (
                  <EventImageBanner key={src} src={src} alt="" variant="community" className="dsk-community-thumb" />
                ))}
              </div>
            </div>
          </div>

          <aside className="dsk-ev-sidebar">
            <div className="dsk-sidebar-card">
              <div className="dsk-sidebar-np-row" style={{ alignItems: 'flex-start' }}>
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">{ev.date}</p>
                  {(ev.mission || ev.subtitle) ? (
                    <p className="dsk-modal-section-text" style={{ fontSize: 13, marginTop: 8, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ev.mission || ev.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 13 }}
                onClick={() => setShowNpModal(true)}
              >
                Learn more
              </button>
              <button
                className="dsk-sidebar-back-btn"
                style={backed ? { background: 'var(--green)' } : {}}
                onClick={() => {
                  if (isAuthenticated || loggedIn) {
                    setBacked(!backed);
                    return;
                  }
                  openGate('donate');
                }}
              >
                {backed ? 'Backed ✓' : 'Back this event'}
              </button>
              <button className="dsk-sidebar-share-btn" onClick={() => setShowShare(true)}>Share</button>
              <div className="dsk-sidebar-stats">
                <span><Users size={13} /> {ev.backed} backing</span>
                <span>{ev.joined} joined</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={shareUrl}
          title={eventDisplayTitle(ev.title)}
          subtitle={`${ev.nonprofit} · verified`}
          previewSrc={ev.cover}
        />
      )}

      <EventNonprofitLearnMore
        open={showNpModal}
        onClose={() => setShowNpModal(false)}
        event={ev}
        fallbackName={ev.nonprofit}
        fallbackInitials={ev.npInitials}
        fallbackBg={ev.npBg}
        fallbackCategory={ev.category}
        fallbackDescription={ev.mission || ev.subtitle}
      />

      <EventBackersModal
        open={showBackersModal}
        onClose={() => setShowBackersModal(false)}
        count={ev.backed}
        eventTitle={ev.title}
        raised={ev.raised}
        backers={backers}
        loading={backersLoading}
      />

      {showJoinGate && (
        <DesktopJoinGateModal
          open={showJoinGate}
          onClose={() => setShowJoinGate(false)}
          eventTitle={ev.title}
          nonprofit={ev.nonprofit}
          npInitials={ev.npInitials}
          npBg={ev.npBg}
          intent={gateIntent}
        />
      )}

      {toast && <div className="dsk-live-toast">{toast}</div>}
    </div>
  );
}
