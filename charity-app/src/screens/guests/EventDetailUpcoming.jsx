import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Bookmark, MapPin, Share2, Heart, Calendar, ChevronRight } from 'lucide-react';
import { EventBackersModal } from '../../components/event/EventModals';
import EventNonprofitLearnMore from '../../components/event/EventNonprofitLearnMore';
import { slugify, eventDisplayTitle, getCommunityPhotos, eventUpcomingPath, getEventBannerFocus } from '../../data/mockData';
import { EventImageBanner } from '../../components/event/EventImage';
import MobileShareModal from '../../components/MobileShareModal';
import MobileJoinModal from '../../components/MobileJoinModal';
import { useAuth } from '../../auth/AuthContext';
import { useEventDetail, useEventBackers, useEventActions } from '../../hooks/useEventDetail';

const BACKER_COLORS = ['var(--primary)', 'var(--primary-hover)', '#5BB8F5', '#1A6EB5', 'var(--secondary-soft)'];

export default function EventDetailUpcoming({ loggedIn = false }) {
  const navigate = useNavigate();
  const { eventKey } = useParams();
  const { isAuthenticated } = useAuth();
  const { ev, loading, error } = useEventDetail(eventKey);
  const [following, setFollowing] = useState(false);
  const [backed, setBacked] = useState(false);
  const [showNpModal, setShowNpModal] = useState(false);
  const [showBackersModal, setShowBackersModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [gateIntent, setGateIntent] = useState('default');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const openGate = (intent = 'default') => {
    setGateIntent(intent);
    setShowJoin(true);
  };

  const handleFollow = () => {
    if (isAuthenticated || loggedIn) {
      setFollowing((f) => !f);
      return;
    }
    openGate('follow');
  };

  const { liked, saved, handleLike, handleSave } = useEventActions({
    ev,
    loggedIn,
    isAuthenticated,
    onNeedAuth: (intent) => openGate(intent || 'default'),
    showToast,
  });

  const { backers, loading: backersLoading } = useEventBackers(eventKey, showBackersModal, showToast);

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="detail-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading event…</p>
        </div>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="phone-shell">
        <div className="detail-screen" style={{ padding: 24 }}>
          <button type="button" className="back-btn" onClick={() => navigate('/guest/feed')} aria-label="Back to feed">
            <ChevronLeft size={18} />
          </button>
          <p style={{ marginTop: 24, fontWeight: 700, color: 'var(--dark)' }}>Couldn&apos;t load event</p>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14 }}>{error?.message || 'Not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          {/* Hero */}
          <EventImageBanner src={ev.cover} alt={ev.title} variant="hero" className="detail-hero" style={{ height: 240 }} objectPosition={getEventBannerFocus(ev)}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
            }} />

            {/* Top nav */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '48px 16px 0',
            }}>
              <button
                className="back-btn"
                aria-label="Back to feed"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                onClick={() => navigate('/guest/feed')}
              >
                <ChevronLeft size={18} color="white" />
              </button>
              <button
                onClick={handleSave}
                aria-label={saved ? 'Remove bookmark' : 'Save event'}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <Bookmark size={18} color="white" fill={saved ? 'white' : 'none'} />
              </button>
            </div>

            {/* Date + location pills */}
            <div style={{
              position: 'absolute', bottom: 42, left: 14, display: 'flex', gap: 8,
            }}>
              <span className="hero-pill coral">
                <Calendar size={10} />
                {(ev.date || 'TBA').split(',')[0]} · {(ev.startTime || 'TBA').replace(':00', '')}
              </span>
              <span className="hero-pill coral">
                <MapPin size={10} />
                {(ev.location || 'TBA').split(',')[0]}
              </span>
            </div>
          </EventImageBanner>

          {/* White detail card */}
          <div className="detail-card">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              {ev.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              <MapPin size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ev.location}</span>
            </div>

            {/* Nonprofit row */}
            <div className="np-info-row">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: ev.npBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>{ev.npInitials}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{ev.nonprofit}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Nonprofit</p>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => setShowNpModal(true)}
              >Learn more</button>
            </div>

            {/* Backers */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`View ${ev.backed} people backing this event`}
              onClick={() => setShowBackersModal(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowBackersModal(true);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 0,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="av-stack">
                  {BACKER_COLORS.map((c, i) => (
                    <div key={i} className="av" style={{ background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
                  {ev.backed} people are backing this
                </span>
              </div>
              <ChevronRight size={16} color="var(--text-light)" />
            </div>

            {/* Organiser */}
            <div className="organiser-row">
              <div
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
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: ev.npBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer',
                }}
              >{ev.initials}</div>
              <div
                role="button"
                tabIndex={0}
                aria-label={`View ${ev.organizer}'s profile`}
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => navigate(`/guest/organizer/${slugify(ev.organizer)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/guest/organizer/${slugify(ev.organizer)}`);
                  }
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                  {ev.organizer}{' '}
                  <span style={{
                    display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--blue)', color: 'white', fontSize: 9,
                    alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                  }}>✓</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Organiser</p>
              </div>
              <button
                className="follow-btn"
                onClick={handleFollow}
                style={following ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* The Mission */}
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
              The Mission
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {ev.subtitle}
            </p>

            {/* Photo grid */}
            <div className="photo-grid-2">
              {getCommunityPhotos(ev).map((src) => (
                <EventImageBanner key={src} src={src} alt="" variant="grid" />
              ))}
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="event-bar">
          <button className="event-bar-icon" onClick={() => setShowShare(true)} aria-label="Share event">
            <Share2 size={18} color="var(--dark)" />
          </button>
          <button
            className="event-bar-btn"
            onClick={() => {
              if (isAuthenticated || loggedIn) {
                setBacked((prev) => !prev);
                return;
              }
              openGate('donate');
            }}
          >
            {backed ? 'Backed ✓' : 'Back this event'}
          </button>
          <button className="event-bar-icon" onClick={handleLike} aria-label={liked ? 'Unlike event' : 'Like event'}>
            <Heart size={18} color={liked ? 'var(--primary)' : 'var(--dark)'} fill={liked ? 'var(--primary)' : 'none'} />
          </button>
        </div>

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

        {showShare && (
          <MobileShareModal
            title={eventDisplayTitle(ev.title)}
            subtitle={`${ev.nonprofit} · verified`}
            url={`https://charity-prototype.vercel.app${eventUpcomingPath(ev.key)}`}
            onClose={() => setShowShare(false)}
          />
        )}

        {showJoin && (
          <MobileJoinModal
            title={eventDisplayTitle(ev.title)}
            subtitle={ev.nonprofit}
            intent={gateIntent}
            onClose={() => setShowJoin(false)}
          />
        )}

        {toast && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '10px 18px',
            borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 100, maxWidth: '80%', textAlign: 'center',
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
