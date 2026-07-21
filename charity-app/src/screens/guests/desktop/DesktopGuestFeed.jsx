import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, MessageCircle, Camera } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopFooter from '../../../components/desktop/DesktopFooter';
import FilterPillRow from '../../../components/FilterPillRow';
import { events, ALL_BROWSE_FILTERS, eventDetailPath, eventDisplayTitle } from '../../../data/mockData';
import { getCategoryIcon, DISCOVERY_FILTERS } from '../../../data/categoryIcons';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import { EventImageBanner } from '../../../components/event/EventImage';

function SceneEventCard({ ev }) {
  const navigate = useNavigate();

  return (
    <div
      className="dsk-event-card"
      role="button"
      tabIndex={0}
      aria-label={`View ${ev.title}`}
      onClick={() => navigate(eventDetailPath(ev, { loggedIn: false }))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(eventDetailPath(ev, { loggedIn: false }));
        }
      }}
    >
      <EventImageBanner src={ev.cover} alt={ev.title} variant="card" className="dsk-event-card-hero">
        <div className="dsk-event-card-badges">
          {ev.isLive ? (
            <span className="dsk-badge-live"><span className="live-dot" /> LIVE NOW</span>
          ) : (
            <span className="dsk-badge-date">{ev.date}</span>
          )}
          <span className="dsk-badge-cat">
            {ev.category}
          </span>
        </div>
        <div className="dsk-event-card-title-wrap">
          <p className="dsk-event-card-title">{eventDisplayTitle(ev.title)}</p>
        </div>
      </EventImageBanner>

      <div className="dsk-event-card-body">
        <div className="dsk-event-card-org">
          <div className="dsk-event-card-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
          <div>
            <p className="dsk-event-card-orgname">{ev.nonprofit} <span className="dsk-verify-dot">✓</span></p>
            <p className="dsk-event-card-hostedby">Hosted by {ev.organizer}</p>
          </div>
        </div>

        <div className="dsk-event-card-stats-row">
          <span className="dsk-event-card-stat"><Users size={12} /> {ev.backed} backing</span>
          <span className="dsk-event-card-stat"><MessageCircle size={12} /> {ev.chatCount} in chat</span>
          <span className="dsk-event-card-stat"><Camera size={12} /> {ev.updates} moments</span>
        </div>
      </div>
    </div>
  );
}

export default function DesktopGuestFeed() {
  const [searchParams] = useSearchParams();
  const causeParam = searchParams.get('cause');
  const [category, setCategory] = useState(
    causeParam && ALL_BROWSE_FILTERS.includes(causeParam) ? causeParam : 'All',
  );
  const [discovery, setDiscovery] = useState('All');
  const [query, setQuery] = useState('');
  const isFollowing = discovery === 'Following';

  useEffect(() => {
    if (causeParam && ALL_BROWSE_FILTERS.includes(causeParam)) {
      setCategory(causeParam);
    }
  }, [causeParam]);

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (discovery === 'Live now') return e.isLive;
      if (isFollowing) return false; // no follow graph yet — see the empty state below
      return true;
    });
    if (discovery === 'Popular') list = [...list].sort((a, b) => b.backed - a.backed);
    if (discovery === 'New') list = [...list].reverse();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.nonprofit.toLowerCase().includes(q));
    }
    return list;
  }, [category, discovery, isFollowing, query]);

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(filtered, {
    pageSize: 6,
    max: 36,
  });

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" homePath="/guest/feed" />

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-feed-head">
            <h1 className="dsk-page-title">The Scene</h1>
            <p className="dsk-page-subtitle">Events happening now — discover and back causes you care about.</p>
          </div>

          <div className="dsk-category-rail">
            {['All', ...ALL_BROWSE_FILTERS].map((cat) => {
              const { Icon, color } = getCategoryIcon(cat);
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`dsk-category-tile${active ? ' active' : ''}`}
                  aria-pressed={active}
                  aria-label={`Browse ${cat} events`}
                  onClick={() => setCategory(cat)}
                >
                  <span
                    className="dsk-category-tile-icon"
                    style={{ background: active ? color : `${color}1A`, color: active ? 'white' : color }}
                  >
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <span className="dsk-category-tile-label">{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Discovery row — how to surface events, a different axis from the category rail above */}
          <div id="dsk-feed-filters" className="dsk-feed-controls">
            <FilterPillRow
              filters={DISCOVERY_FILTERS}
              active={discovery}
              onSelect={setDiscovery}
              rowClassName="dsk-filter-row"
              chipClassName="dsk-filter-chip"
            />
            <div className="dsk-feed-right">
              <input
                className="dsk-feed-search"
                placeholder="Search events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {isFollowing ? (
            <div className="discovery-empty">
              <p className="discovery-empty-title">You&apos;re not following anyone yet</p>
              <p className="discovery-empty-copy">
                Follow organisers and nonprofits from an event page to see their events here.
              </p>
            </div>
          ) : (
            <div className="dsk-event-grid">
              {items.map((ev) => (
                <SceneEventCard key={ev._key} ev={ev} />
              ))}
              {filtered.length === 0 && (
                <p className="dsk-empty-note">No events match this filter yet.</p>
              )}
            </div>
          )}

          {hasMore && filtered.length > 0 && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
          {loading && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
          )}
          {!hasMore && filtered.length > 0 && (
            <p className="feed-end">You&apos;re all caught up</p>
          )}
        </div>
      </main>

      <DesktopFooter />
    </div>
  );
}
