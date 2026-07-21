import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Camera, User } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import { events, ALL_BROWSE_FILTERS, SE_FEED_FILTERS, SE_ORGANIZER, eventDetailPath, eventDisplayTitle } from '../../data/mockData';
import { getCategoryIcon } from '../../data/categoryIcons';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { EventImageBanner } from '../../components/event/EventImage';

function SceneEventCard({ ev }) {
  const navigate = useNavigate();

  return (
    <div className="dsk-event-card" onClick={() => navigate(eventDetailPath(ev, { loggedIn: true }))}>
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

export default function DesktopFeedScreen() {
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter === 'Live now') return e.isLive;
      if (filter === 'You') return e.organizer === SE_ORGANIZER.name;
      if (filter !== 'All') return e.category === filter;
      return true;
    });
  }, [filter]);

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(filtered, {
    pageSize: 6,
    max: 36,
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
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`dsk-category-tile${active ? ' active' : ''}`}
                  aria-pressed={active}
                  aria-label={`Browse ${cat} events`}
                  onClick={() => setFilter(cat)}
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

          <div className="dsk-feed-controls">
            <div className="dsk-filter-row">
              {SE_FEED_FILTERS.map((f) => {
                const active = filter === f;
                if (f === 'Live now') {
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`dsk-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      <span className="live-dot" style={{ background: active ? 'white' : 'var(--primary)' }} />
                      Live now
                    </button>
                  );
                }
                const { Icon, color } = f === 'You' ? { Icon: User, color: 'var(--primary)' } : getCategoryIcon(f);
                return (
                  <button
                    key={f}
                    type="button"
                    className={`dsk-filter-chip ${active ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    <Icon size={13} color={active ? 'white' : color} aria-hidden="true" />
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dsk-event-grid">
            {items.map((ev) => (
              <SceneEventCard key={ev._key} ev={ev} />
            ))}
            {filtered.length === 0 && (
              <p className="dsk-empty-note">No events match this filter yet.</p>
            )}
          </div>

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
