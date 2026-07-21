import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Camera, Bell } from 'lucide-react';
import GuestBottomNav from '../../components/GuestBottomNav';
import MobileAppHeader from '../../components/MobileAppHeader';
import { events, ALL_BROWSE_FILTERS, GUEST_FEED_FILTERS, eventDetailPath, eventDisplayTitle } from '../../data/mockData';
import { getCategoryIcon } from '../../data/categoryIcons';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { EventImageBanner } from '../../components/event/EventImage';

const activateOnKey = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

export default function GuestFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const causeParam = searchParams.get('cause');
  const [activeFilter, setActiveFilter] = useState(
    causeParam && GUEST_FEED_FILTERS.includes(causeParam) ? causeParam : 'All',
  );
  const [hasAlerts, setHasAlerts] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (causeParam && GUEST_FEED_FILTERS.includes(causeParam)) {
      setActiveFilter(causeParam);
    }
  }, [causeParam]);

  const filtered = events.filter((ev) => {
    if (activeFilter === 'Live now') return ev.isLive;
    if (activeFilter !== 'All') return ev.category === activeFilter;
    return true;
  });

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(filtered, {
    rootRef: scrollRef, pageSize: 3, max: 30,
  });

  const openEvent = (ev) => navigate(eventDetailPath(ev, { loggedIn: false }));

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-top">
          <MobileAppHeader
            homePath="/guest/feed"
            title="The Scene"
            subtitle="Events happening now"
            actions={(
              <>
                <button
                  type="button"
                  aria-label="Notifications"
                  style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                  onClick={() => setHasAlerts(false)}
                >
                  <Bell size={22} color="var(--dark)" />
                  {hasAlerts && <span className="np-notify-dot" />}
                </button>
                <button
                  type="button"
                  className="guest-signup-btn"
                  onClick={() => navigate('/')}
                >
                  Sign up
                </button>
              </>
            )}
          />

          <div className="category-rail">
            {['All', ...ALL_BROWSE_FILTERS].map((cat) => {
              const { Icon, color } = getCategoryIcon(cat);
              const active = activeFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-tile${active ? ' active' : ''}`}
                  aria-pressed={active}
                  aria-label={`Browse ${cat} events`}
                  onClick={() => setActiveFilter(cat)}
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

          {/* Filter chips — same list as the rail above, with an icon in each label */}
          <div className="filter-row">
            {GUEST_FEED_FILTERS.map((f) => {
              const active = activeFilter === f;
              if (f === 'Live now') {
                return (
                  <button
                    key={f}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: active ? 'white' : 'var(--primary)',
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    Live now
                  </button>
                );
              }
              const { Icon, color } = getCategoryIcon(f);
              return (
                <button
                  key={f}
                  type="button"
                  className={`filter-chip ${active ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  <Icon size={13} color={active ? 'white' : color} aria-hidden="true" />
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <div className="screen-scroll" ref={scrollRef}>
          <div style={{ padding: '0 16px 16px' }}>
            {items.map((ev) => (
              <div
                key={ev._key}
                className="scene-card"
                role="button"
                tabIndex={0}
                aria-label={`Open ${ev.title}`}
                onClick={() => openEvent(ev)}
                onKeyDown={activateOnKey(() => openEvent(ev))}
              >
                <EventImageBanner src={ev.cover} alt={ev.title} variant="card" className="scene-card-hero">
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
            {loading && (
              <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
            )}
            {!hasMore && <p className="feed-end">You&apos;re all caught up</p>}
          </div>
        </div>

        <GuestBottomNav active="discover" />
      </div>
    </div>
  );
}
