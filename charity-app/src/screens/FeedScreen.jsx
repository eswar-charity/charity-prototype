import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Building2, Compass, MessageCircle, Camera } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import MobileAppHeader from '../components/MobileAppHeader';
import FilterPillRow from '../components/FilterPillRow';
import { ALL_BROWSE_FILTERS, eventDisplayTitle, getEventBannerFocus } from '../data/mockData';
import { getCategoryIcon, DISCOVERY_FILTERS } from '../data/categoryIcons';
import usePagedFeed from '../hooks/usePagedFeed';
import { EventImageBanner } from '../components/event/EventImage';
import { listEvents } from '../api/events';
import { adaptEvent } from '../api/adapters/event';
import { eventDetailPath } from '../utils/eventPaths';
import { useAuth } from '../auth/AuthContext';

const activateOnKey = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

/** Map Scene discovery pills → API `discovery` query values. */
function mapDiscovery(label) {
  if (label === 'Live now') return 'live';
  if (label === 'Popular') return 'popular';
  if (label === 'New') return 'new';
  return undefined;
}

function enrichFeedEvent(ev) {
  const np = ev.nonprofitBrief;
  return {
    ...ev,
    cover: ev.photos?.[0] || (ev.key ? `/events/${ev.key}/img1.jpg` : undefined),
    chatCount: ev.chat ?? 0,
    npInitials: np?.initials || (ev.nonprofit ? ev.nonprofit.slice(0, 2).toUpperCase() : 'NP'),
    npBg: np?.color || '#1A6EB5',
  };
}

export default function FeedScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDiscovery, setActiveDiscovery] = useState('All');
  const [showSheet, setShowSheet] = useState(false);
  const scrollRef = useRef(null);

  const isFollowing = activeDiscovery === 'Following';

  const fetcher = useCallback(async ({ page, limit }) => {
    if (activeDiscovery === 'Following') {
      return { items: [], total: 0, has_more: false };
    }
    const res = await listEvents({
      cause: activeCategory !== 'All' ? activeCategory : undefined,
      discovery: mapDiscovery(activeDiscovery),
      page,
      limit,
    });
    return {
      items: (res.items ?? []).map((raw) => enrichFeedEvent(adaptEvent(raw))),
      total: res.total,
      has_more: res.has_more,
    };
  }, [activeCategory, activeDiscovery]);

  const { items, sentinelRef, loading, error, hasMore, reload } = usePagedFeed(fetcher, {
    pageSize: 10,
    deps: [activeCategory, activeDiscovery],
  });

  const openEvent = (ev) => navigate(eventDetailPath(ev, { loggedIn: true }));

  return (
    <div className="phone-shell">
      <div className="screen screen--split">

        {/* ── Fixed top section (does NOT scroll) ── */}
        <div className="screen-top">
          <MobileAppHeader
            homePath="/feed"
            title="The Scene"
            subtitle="Events happening now"
            actions={(
              <>
                <NotificationBell />
                <div
                  className="scene-avatar"
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  aria-label="Open your profile"
                  onClick={() => navigate('/profile')}
                  onKeyDown={activateOnKey(() => navigate('/profile'))}
                >{user?.initials ?? '?'}</div>
              </>
            )}
          />

          {/* Category rail — primary navigation by cause, not by story photo */}
          <div className="category-rail">
            {['All', ...ALL_BROWSE_FILTERS].map((cat) => {
              const { Icon, color } = getCategoryIcon(cat);
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-tile${active ? ' active' : ''}`}
                  aria-pressed={active}
                  aria-label={`Browse ${cat} events`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span
                    className="category-tile-icon"
                    style={{ background: active ? color : `${color}1A`, color: active ? 'white' : color }}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="category-tile-label">{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Discovery row — how to surface events (live, nearby, followed,
              popular, new), a different axis from the category rail above */}
          <FilterPillRow filters={DISCOVERY_FILTERS} active={activeDiscovery} onSelect={setActiveDiscovery} />
        </div>

        {/* ── Scrollable feed cards ONLY ── */}
        <div className="screen-scroll" ref={scrollRef}>
          <div style={{ padding: '0 16px 16px' }}>
          {isFollowing ? (
            <div className="discovery-empty">
              <p className="discovery-empty-title">You&apos;re not following anyone yet</p>
              <p className="discovery-empty-copy">
                Follow organisers and nonprofits from an event page to see their events here.
              </p>
            </div>
          ) : error && items.length === 0 ? (
            <div className="discovery-empty" role="alert">
              <p className="discovery-empty-title">Couldn&apos;t load events</p>
              <p className="discovery-empty-copy">{error.message || 'Something went wrong.'}</p>
              <button type="button" className="guest-signup-btn" style={{ marginTop: 12 }} onClick={reload}>
                Try again
              </button>
            </div>
          ) : (
            <>
          {loading && items.length === 0 && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading events…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="discovery-empty">
              <p className="discovery-empty-title">No events match this filter yet</p>
              <p className="discovery-empty-copy">Try another category or discovery filter.</p>
            </div>
          )}
          {items.map((ev) => (
            <div
              key={ev.id ?? ev.key}
              className="scene-card"
              role="button"
              tabIndex={0}
              aria-label={`Open ${ev.title}`}
              onClick={() => openEvent(ev)}
              onKeyDown={activateOnKey(() => openEvent(ev))}
            >
              {/* Hero image */}
              <EventImageBanner src={ev.cover} alt={ev.title} variant="card" className="scene-card-hero" objectPosition={getEventBannerFocus(ev)}>
                <div className="scene-card-badges">
                  {ev.isLive ? (
                    <span className="scene-badge-live"><span className="live-dot" /> LIVE NOW</span>
                  ) : (
                    <span className="scene-badge-date">{ev.date}</span>
                  )}
                  <span className="scene-badge-cat">{ev.category}</span>
                </div>
                <div className="scene-card-overlay">
                  <h3 className="scene-card-title">{eventDisplayTitle(ev.title)}</h3>
                </div>
              </EventImageBanner>

              {/* Meta row */}
              <div className="scene-card-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: ev.npBg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'white',
                  }}>{ev.npInitials}</div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--dark)', fontWeight: 600 }}>for {ev.nonprofit}</span>
                    {' · '}by {ev.organizer}
                  </span>
                </div>
                <div className="scene-card-stats">
                  <div className="av-stack" style={{ marginRight: 4 }}>
                    {['var(--primary)', 'var(--primary-hover)', '#5BB8F5'].map((c, i) => (
                      <div key={i} className="av" style={{ background: c, width: 18, height: 18, fontSize: 8 }} />
                    ))}
                  </div>
                  <span className="scene-stat">{ev.backed} <span className="scene-stat-lbl">backing</span></span>
                  <span className="scene-stat-sep">·</span>
                  <span className="scene-stat">
                    <MessageCircle size={13} color="currentColor" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
                    {' '}{ev.chatCount} <span className="scene-stat-lbl">in chat</span>
                  </span>
                  <span className="scene-stat-sep">·</span>
                  <span className="scene-stat">
                    <Camera size={13} color="currentColor" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" />
                    {' '}{ev.updates} <span className="scene-stat-lbl">moments</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
          {loading && items.length > 0 && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
          )}
          {!loading && !hasMore && items.length > 0 && (
            <p className="feed-end">You&apos;re all caught up</p>
          )}
            </>
          )}
          </div>
        </div>{/* end scrollable area */}

        <BottomNav active="feed" onPlusClick={() => setShowSheet(true)} />
      </div>

      {/* ── Create event bottom sheet ── */}
      {showSheet && (
        <div
          className="overlay-bg"
          onClick={() => setShowSheet(false)}
        >
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', textAlign: 'center', marginBottom: 6 }}>
              Start something good
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Create a free event for any verified nonprofit. Your story drives real participation.
            </p>

            <div
              className="opt-row"
              role="button"
              tabIndex={0}
              onClick={() => { setShowSheet(false); navigate('/event/step-1'); }}
              onKeyDown={activateOnKey(() => { setShowSheet(false); navigate('/event/step-1'); })}
            >
              <div className="opt-icon" style={{ background: 'var(--primary)' }}>
                <Megaphone size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Create an event</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  For a verified nonprofit of your choice.
                </p>
              </div>
              <Compass size={16} color="var(--text-light)" />
            </div>

            <div
              className="opt-row"
              role="button"
              tabIndex={0}
              onClick={() => { setShowSheet(false); navigate('/np/home'); }}
              onKeyDown={activateOnKey(() => { setShowSheet(false); navigate('/np/home'); })}
            >
              <div className="opt-icon" style={{ background: 'var(--blue)' }}>
                <Building2 size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>I represent a nonprofit</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Register your 501(c)(3) on Charity Hub.
                </p>
              </div>
              <Compass size={16} color="var(--text-light)" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
