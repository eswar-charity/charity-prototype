import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Camera } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import FilterPillRow from '../../components/FilterPillRow';
import { ALL_BROWSE_FILTERS, eventDisplayTitle, getEventBannerFocus } from '../../data/mockData';
import { getCategoryIcon, DISCOVERY_FILTERS } from '../../data/categoryIcons';
import usePagedFeed from '../../hooks/usePagedFeed';
import { EventImageBanner } from '../../components/event/EventImage';
import { listEvents } from '../../api/events';
import { adaptEvent } from '../../api/adapters/event';
import { eventDetailPath } from '../../utils/eventPaths';

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

function SceneEventCard({ ev }) {
  const navigate = useNavigate();

  return (
    <div className="dsk-event-card" onClick={() => navigate(eventDetailPath(ev, { loggedIn: true }))}>
      <EventImageBanner src={ev.cover} alt={ev.title} variant="card" className="dsk-event-card-hero" objectPosition={getEventBannerFocus(ev)}>
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

export default function DesktopFeedScreen() {
  const [category, setCategory] = useState('All');
  const [discovery, setDiscovery] = useState('All');
  const isFollowing = discovery === 'Following';

  const fetcher = useCallback(async ({ page, limit }) => {
    if (discovery === 'Following') {
      return { items: [], total: 0, has_more: false };
    }
    const res = await listEvents({
      cause: category !== 'All' ? category : undefined,
      discovery: mapDiscovery(discovery),
      page,
      limit,
    });
    return {
      items: (res.items ?? []).map((raw) => enrichFeedEvent(adaptEvent(raw))),
      total: res.total,
      has_more: res.has_more,
    };
  }, [category, discovery]);

  const { items, sentinelRef, loading, error, hasMore, reload } = usePagedFeed(fetcher, {
    pageSize: 12,
    deps: [category, discovery],
  });

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" showSearch={false} />

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-feed-head">
            <h1 className="dsk-page-title">The Scene</h1>
            <p className="dsk-page-subtitle">Events happening now — your hub for hosting and backing causes.</p>
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
          <div className="dsk-feed-controls">
            <FilterPillRow
              filters={DISCOVERY_FILTERS}
              active={discovery}
              onSelect={setDiscovery}
              rowClassName="dsk-filter-row"
              chipClassName="dsk-filter-chip"
            />
          </div>

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
              <button type="button" className="dsk-btn-primary" style={{ marginTop: 12 }} onClick={reload}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {loading && items.length === 0 && (
                <div className="feed-loader"><span className="feed-spinner" /> Loading events…</div>
              )}
              <div className="dsk-event-grid">
                {items.map((ev) => (
                  <SceneEventCard key={ev.id ?? ev.key} ev={ev} />
                ))}
                {!loading && items.length === 0 && (
                  <p className="dsk-empty-note">No events match this filter yet.</p>
                )}
              </div>
            </>
          )}

          {hasMore && !isFollowing && items.length > 0 && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
          {loading && items.length > 0 && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
          )}
          {!loading && !hasMore && items.length > 0 && !isFollowing && (
            <p className="feed-end">You&apos;re all caught up</p>
          )}
        </div>
      </main>

      <DesktopFooter />
    </div>
  );
}
