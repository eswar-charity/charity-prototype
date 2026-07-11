import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, MessageCircle } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopFooter from '../../../components/desktop/DesktopFooter';
import { events } from '../../../data/mockData';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';

const CATEGORIES = [...new Set(events.map((e) => e.category))];
const FILTERS = ['All', 'Live now', ...CATEGORIES];

function EventCard({ ev, onRemind, reminded }) {
  const navigate = useNavigate();
  const route = ev.isLive ? '/guest/event/live' : '/guest/event/upcoming';

  return (
    <div
      className="dsk-event-card"
      role="button"
      tabIndex={0}
      aria-label={`View ${ev.title}`}
      onClick={() => navigate(route)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(route);
        }
      }}
    >
      <div
        className="dsk-event-card-hero"
        style={{ backgroundImage: `url(${ev.cover})` }}
      >
        <div className="dsk-event-card-badges">
          {ev.isLive ? (
            <span className="dsk-badge-live"><span className="live-dot" /> LIVE NOW</span>
          ) : (
            <span className="dsk-badge-date">{ev.date}</span>
          )}
          <span className="dsk-badge-cat" style={{ background: ev.catBg, color: ev.catColor }}>
            {ev.category}
          </span>
        </div>
        <div className="dsk-event-card-title-wrap">
          <p className="dsk-event-card-title">{ev.title}</p>
          <p className="dsk-event-card-loc">{ev.location}</p>
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
          {ev.isLive && (
            <span className="dsk-event-card-stat"><MessageCircle size={12} /> {ev.chatCount} chatting</span>
          )}

          {ev.isLive ? (
            <button
              className="dsk-card-cta primary"
              onClick={(e) => { e.stopPropagation(); navigate(route); }}
            >
              Back this
            </button>
          ) : (
            <button
              className={`dsk-card-cta ${reminded ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onRemind(ev.id); }}
            >
              {reminded ? 'Reminder set ✓' : 'Remind me'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DesktopGuestFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isCausesView = searchParams.get('view') === 'causes';
  const [filter, setFilter] = useState(() => {
    const cause = searchParams.get('cause');
    return cause && FILTERS.includes(cause) ? cause : 'All';
  });
  const [sort, setSort] = useState('trending');
  const [query, setQuery] = useState('');
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    if (isCausesView) {
      document.getElementById('dsk-feed-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isCausesView]);

  useEffect(() => {
    const cause = searchParams.get('cause');
    if (cause && FILTERS.includes(cause)) {
      setFilter(cause);
      return;
    }
    if (!searchParams.get('view')) {
      setFilter('All');
    }
  }, [searchParams]);

  const setCauseFilter = (next) => {
    setFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'All') {
      params.delete('cause');
      if (!isCausesView) params.delete('view');
    } else {
      params.set('view', 'causes');
      params.set('cause', next);
    }
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      if (filter === 'Live now') return e.isLive;
      if (filter !== 'All') return e.category === filter;
      return true;
    });
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === 'backed') list.sort((a, b) => b.backed - a.backed);
    else if (sort === 'newest') list.reverse();
    return list;
  }, [filter, sort, query]);

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(filtered, {
    pageSize: 6, max: 36,
  });

  return (
    <div className="dsk-page">
      <DesktopHeader active={isCausesView || filter !== 'All' ? 'Causes' : 'Discover'} />

      <main className="dsk-main">
        <div className="dsk-container">
          <div className="dsk-feed-head">
            <h1 className="dsk-page-title">{isCausesView || filter !== 'All' ? 'Causes' : 'The Scene'}</h1>
            <p className="dsk-page-subtitle">
              {isCausesView || filter !== 'All'
                ? 'Browse live and upcoming events by the causes you care about.'
                : 'Live and upcoming events for verified nonprofits, curated for you.'}
            </p>
          </div>

          <div id="dsk-feed-filters" className="dsk-feed-controls">
            <div className="dsk-filter-row">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`dsk-filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setCauseFilter(f)}
                >
                  {f === 'Live now' && <span className="live-dot" style={{ background: filter === f ? 'white' : 'var(--primary)' }} />}
                  {f}
                </button>
              ))}
            </div>
            <div className="dsk-feed-right">
              <input
                className="dsk-feed-search"
                placeholder="Search this list..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select className="dsk-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="trending">Trending</option>
                <option value="backed">Most backed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="dsk-event-grid">
            {items.map((ev) => (
              <EventCard
                key={ev._key}
                ev={ev}
                reminded={!!reminders[ev._key]}
                onRemind={() => setReminders((r) => ({ ...r, [ev._key]: !r[ev._key] }))}
              />
            ))}
            {filtered.length === 0 && (
              <p className="dsk-empty-note">No events match this filter yet.</p>
            )}
          </div>

          {/* Infinite scroll */}
          {hasMore && filtered.length > 0 && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}
          {loading && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
          )}
          {!hasMore && filtered.length > 0 && (
            <p className="feed-end">You’re all caught up</p>
          )}
        </div>
      </main>

      <DesktopFooter />
    </div>
  );
}
