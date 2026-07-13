import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, Camera } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import { events, storyReel, SE_FEED_FILTERS, SE_ORGANIZER, eventDetailPath } from '../../data/mockData';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

function SceneEventCard({ ev }) {
  const navigate = useNavigate();

  return (
    <div className="dsk-event-card" onClick={() => navigate(eventDetailPath(ev, { loggedIn: true }))}>
      <div className="dsk-event-card-hero" style={{ backgroundImage: `url(${ev.cover})` }}>
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
          <p className="dsk-event-card-title">#{ev.title.replace(/[\s,'']+/g, '')}</p>
        </div>
      </div>

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
  const navigate = useNavigate();
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

          <div className="dsk-story-row">
            <button type="button" className="dsk-story-item" onClick={() => navigate('/event/step-1')}>
              <div className="dsk-story-circle yours">
                <Plus size={22} color="var(--primary)" />
              </div>
              <span className="dsk-story-label">Your Event</span>
            </button>
            {storyReel.map((story) => (
              <button
                key={story.id}
                type="button"
                className="dsk-story-item"
                onClick={() => navigate(eventDetailPath(story.event, { loggedIn: true }))}
              >
                <div className="dsk-story-circle">
                  <img src={story.src} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="dsk-story-label">{story.title.split(' ').slice(0, 2).join(' ')}</span>
              </button>
            ))}
          </div>

          <div className="dsk-feed-controls">
            <div className="dsk-filter-row">
              {SE_FEED_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`dsk-filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'Live now' && (
                    <span className="live-dot" style={{ background: filter === f ? 'white' : 'var(--primary)' }} />
                  )}
                  {f}
                </button>
              ))}
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
