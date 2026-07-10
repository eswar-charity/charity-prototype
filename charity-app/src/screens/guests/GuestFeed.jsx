import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Share2, Users, Plus } from 'lucide-react';
import GuestBottomNav from '../../components/GuestBottomNav';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import MobileAppHeader from '../../components/MobileAppHeader';

const STORIES = [
  { id: 0, label: 'Add', isAdd: true },
  { id: 1, label: 'Tree Drive', category: 'Environment', bg: 'linear-gradient(135deg,#388E3C,#66BB6A)', emoji: '🌳' },
  { id: 2, label: 'Art Class', category: 'Education', bg: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', emoji: '🎨' },
  { id: 3, label: 'Food Store', category: 'Health', bg: 'linear-gradient(135deg,#1976D2,#42A5F5)', emoji: '🍎' },
  { id: 4, label: 'Ocean', category: 'Environment', bg: 'linear-gradient(135deg,#0288D1,#26C6DA)', emoji: '🌊' },
  { id: 5, label: 'Animals', category: 'Animals', bg: 'linear-gradient(135deg,#D32F2F,#EF5350)', emoji: '🐾' },
];

const EVENTS = [
  {
    id: 1,
    title: 'Neon Night Run',
    subtitle: 'Light up the night for a great cause. A glowing 5K to fund youth fitness programs.',
    organizer: 'Sarah Jenkins',
    joined: 87,
    backing: 213,
    category: 'Health',
    catColor: '#C62828',
    catBg: '#FFEBEE',
    isLive: true,
    cover: '/events/neon-night/img1.jpg',
    route: '/guest/event/live',
  },
  {
    id: 2,
    title: 'Breakneck Ridge Run',
    subtitle: 'A trail run through the Hudson Valley raising awareness for clean waterways.',
    organizer: 'Maya R.',
    joined: 62,
    backing: 145,
    category: 'Environment',
    catColor: '#388E3C',
    catBg: '#E8F5E9',
    isLive: false,
    cover: '/events/breakneck-ridge-run/img1.jpg',
    route: '/guest/event/upcoming',
  },
  {
    id: 3,
    title: "Give Now, Apré Later",
    subtitle: 'Support cold-weather essentials for those in need — then celebrate with friends.',
    organizer: 'Alex T.',
    joined: 44,
    backing: 89,
    category: 'Education',
    catColor: '#1976D2',
    catBg: '#E3F2FD',
    isLive: false,
    cover: '/events/give-now/img1.jpg',
    route: '/guest/event/upcoming',
  },
  {
    id: 4,
    title: 'Dog Dad 5K',
    subtitle: '',
    organizer: '',
    joined: 0,
    backing: 0,
    category: 'Animals',
    catColor: '#E65100',
    catBg: '#FFF3E0',
    isLive: false,
    newStories: 3,
    cover: '/events/dog-dad/img1.jpg',
    route: '/guest/event/upcoming',
  },
];

export default function GuestFeed() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [savedIds, setSavedIds] = useState({});
  const [hasAlerts, setHasAlerts] = useState(true);
  const [activeCause, setActiveCause] = useState(null);
  const scrollRef = useRef(null);

  const visibleEvents = useMemo(
    () => (activeCause ? EVENTS.filter((ev) => ev.category === activeCause) : EVENTS),
    [activeCause]
  );

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(visibleEvents, {
    rootRef: scrollRef, pageSize: 3, max: 24,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const handleStoryClick = (story) => {
    if (story.isAdd) {
      navigate('/guest/join');
      return;
    }
    const next = activeCause === story.category ? null : story.category;
    setActiveCause(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(next ? `Showing ${next} events` : 'Showing all events');
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        {/* Fixed top — header + stories */}
        <div className="screen-top">
          <MobileAppHeader
            homePath="/guest/feed"
            title="Discover"
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

          <div className="story-row guest-story-row">
            {STORIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`story-bubble${!s.isAdd && activeCause === s.category ? ' story-bubble-active' : ''}`}
                onClick={() => handleStoryClick(s)}
              >
                {s.isAdd ? (
                  <div className="story-add-circle">
                    <Plus size={22} color="var(--primary)" />
                  </div>
                ) : (
                  <div className="story-circle" style={{ background: s.bg }}>
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  </div>
                )}
                <span className="story-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable event cards */}
        <div className="screen-scroll" ref={scrollRef}>
          <div className="guest-feed-list">
            {items.length === 0 && activeCause && (
              <p className="feed-end" style={{ paddingTop: 24 }}>
                No {activeCause.toLowerCase()} events right now. Try another cause.
              </p>
            )}
            {items.map((ev) => (
              <div key={ev._key} className="feed-card" onClick={() => navigate(ev.route)}>
                <div className="feed-card-hero" style={{ backgroundImage: `url(${ev.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    display: 'flex', gap: 6,
                  }}>
                    {ev.isLive && (
                      <span className="live-badge">
                        <span className="live-dot" />
                        LIVE NOW
                      </span>
                    )}
                    <span className="badge" style={{ background: ev.catBg, color: ev.catColor }}>
                      {ev.category}
                    </span>
                  </div>
                  {ev.newStories && (
                    <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
                      <span className="new-stories-pill">
                        ● {ev.newStories} new stories
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 3 }}>
                    {ev.title}
                  </p>
                  {ev.subtitle && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
                      {ev.subtitle}
                    </p>
                  )}

                  {ev.organizer && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'linear-gradient(135deg,var(--primary),var(--blue))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: 'white',
                        }}>
                          {ev.organizer.split(' ').map((w) => w[0]).join('')}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)' }}>
                          by {ev.organizer}
                        </span>
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: 'var(--blue)', color: 'white',
                          fontSize: 8, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>✓</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Bookmark
                          size={16}
                          color={savedIds[ev._key] ? 'var(--primary)' : 'var(--text-light)'}
                          fill={savedIds[ev._key] ? 'var(--primary)' : 'none'}
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedIds((prev) => ({ ...prev, [ev._key]: !prev[ev._key] }));
                            showToast(savedIds[ev._key] ? 'Removed from saved' : 'Saved to your list');
                          }}
                        />
                        <Share2 size={16} color="var(--text-light)" style={{ cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); navigate('/guest/share'); }} />
                      </div>
                    </div>
                  )}

                  {ev.joined > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={13} color="var(--text-secondary)" />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ev.joined} joined · {ev.backing} backing
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
            {loading && (
              <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
            )}
            {!hasMore && <p className="feed-end">You&apos;re all caught up 🎉</p>}
          </div>
        </div>

        <GuestBottomNav active="discover" />

        {toast && (
          <div className="guest-toast">{toast}</div>
        )}
      </div>
    </div>
  );
}
