import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Building2, Compass, MessageCircle, Camera, Bell } from 'lucide-react';
import GuestBottomNav from '../../components/GuestBottomNav';
import MobileAppHeader from '../../components/MobileAppHeader';
import { events, storyReel } from '../../data/mockData';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

const CATEGORIES = [...new Set(events.map((ev) => ev.category))];
const FILTERS = ['All', 'Live now', ...CATEGORIES];

const activateOnKey = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

export default function GuestFeed() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSheet, setShowSheet] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(true);
  const scrollRef = useRef(null);

  const filtered = events.filter((ev) => {
    if (activeFilter === 'Live now') return ev.isLive;
    if (activeFilter !== 'All') return ev.category === activeFilter;
    return true;
  });

  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(filtered, {
    rootRef: scrollRef, pageSize: 3, max: 30,
  });

  const openEvent = (ev) => navigate(ev.isLive ? '/guest/event/live' : '/guest/event/upcoming');

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

          <div className="story-row">
            <div
              className="story-item"
              role="button"
              tabIndex={0}
              aria-label="Join an event"
              onClick={() => setShowSheet(true)}
              onKeyDown={activateOnKey(() => setShowSheet(true))}
            >
              <div className="story-circle yours">
                <Plus size={22} color="var(--primary)" />
              </div>
              <span className="story-label">Your Event</span>
            </div>
            {storyReel.map((story) => (
              <div
                key={story.id}
                className="story-item"
                role="button"
                tabIndex={0}
                aria-label={`Open ${story.title}`}
                onClick={() => openEvent(story.event)}
                onKeyDown={activateOnKey(() => openEvent(story.event))}
              >
                <div className="story-circle">
                  <img src={story.src} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="story-label">{story.title.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            ))}
          </div>

          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === 'Live now' ? (
                  <>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: activeFilter === f ? 'white' : 'var(--primary)',
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    Live now
                  </>
                ) : f}
              </button>
            ))}
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
                <div
                  className="scene-card-hero"
                  style={{ backgroundImage: `url(${ev.cover})` }}
                >
                  {ev.isLive ? (
                    <span className="scene-live-badge">
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                      DOORS OPEN · LIVE NOW
                    </span>
                  ) : (
                    <span className="scene-live-badge scene-category-badge">
                      {ev.category.toUpperCase()}
                    </span>
                  )}
                  <div className="scene-card-overlay">
                    <h3 className="scene-card-title">#{ev.title.replace(/[\s,''']+/g, '')}</h3>
                  </div>
                </div>

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

      {showSheet && (
        <div className="overlay-bg" onClick={() => setShowSheet(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', textAlign: 'center', marginBottom: 6 }}>
              Start something good
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Sign up to create a free event for any verified nonprofit. Your story drives real participation.
            </p>

            <div
              className="opt-row"
              role="button"
              tabIndex={0}
              onClick={() => { setShowSheet(false); navigate('/'); }}
              onKeyDown={activateOnKey(() => { setShowSheet(false); navigate('/'); })}
            >
              <div className="opt-icon" style={{ background: 'var(--primary)' }}>
                <Megaphone size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Create an event</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Sign up to host for a verified nonprofit.
                </p>
              </div>
              <Compass size={16} color="var(--text-light)" />
            </div>

            <div
              className="opt-row"
              role="button"
              tabIndex={0}
              onClick={() => { setShowSheet(false); navigate('/guest/join'); }}
              onKeyDown={activateOnKey(() => { setShowSheet(false); navigate('/guest/join'); })}
            >
              <div className="opt-icon" style={{ background: 'var(--blue)' }}>
                <Building2 size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Join an event</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Back or join without a full account yet.
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
