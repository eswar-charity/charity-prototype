import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Share2, Users, Plus } from 'lucide-react';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

const STORIES = [
  { id: 0, label: 'Add', isAdd: true },
  { id: 1, label: 'Tree Drive', bg: 'linear-gradient(135deg,#388E3C,#66BB6A)', emoji: '🌳' },
  { id: 2, label: 'Art Class', bg: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', emoji: '🎨' },
  { id: 3, label: 'Food Store', bg: 'linear-gradient(135deg,#F57C00,#FFB300)', emoji: '🍎' },
  { id: 4, label: 'Ocean', bg: 'linear-gradient(135deg,#0288D1,#26C6DA)', emoji: '🌊' },
  { id: 5, label: 'Animals', bg: 'linear-gradient(135deg,#D32F2F,#EF5350)', emoji: '🐾' },
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
  const scrollRef = useRef(null);
  const { items, sentinelRef, loading, hasMore } = useInfiniteScroll(EVENTS, {
    rootRef: scrollRef, pageSize: 3, max: 24,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="phone-shell">
      <div className="screen" ref={scrollRef}>
        {/* Header */}
        <div className="discover-header">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)' }}>Discover</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell
              size={22}
              color="var(--dark)"
              style={{ cursor: 'pointer' }}
              onClick={() => showToast("You're all caught up")}
            />
            <div
              onClick={() => navigate('/')}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--primary),#FF8A65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer',
              }}
            >SJ</div>
          </div>
        </div>

        {/* Flow switcher */}
        <div style={{ padding: '0 18px 12px', display: 'flex', gap: 8 }}>
          <div
            style={{
              flex: 1, background: 'var(--primary)', borderRadius: 12,
              padding: '10px 14px', cursor: 'pointer', textAlign: 'center',
            }}
            onClick={() => navigate('/feed')}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>SE / Organiser Flow</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Tap to switch →</p>
          </div>
          <div style={{
            flex: 1, background: 'var(--blue)', borderRadius: 12,
            padding: '10px 14px', cursor: 'pointer', textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>Guest Flow</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Current screen</p>
          </div>
        </div>

        {/* Stories row */}
        <div className="story-row" style={{ padding: '0 18px 12px' }}>
          {STORIES.map((s) => (
            <div
              key={s.id}
              className="story-bubble"
              onClick={() => navigate(s.isAdd ? '/guest/join' : '/guest/event/live')}
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
            </div>
          ))}
        </div>

        {/* Event cards */}
        <div style={{ padding: '0 18px 20px' }}>
          {items.map((ev) => (
            <div key={ev._key} className="feed-card" onClick={() => navigate(ev.route)}>
              {/* Hero */}
              <div className="feed-card-hero" style={{ backgroundImage: `url(${ev.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {/* Gradient overlay for readability */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
                }} />
                {/* Badges */}
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

              {/* Body */}
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
                        background: 'linear-gradient(135deg,var(--primary),#FF8A65)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: 'white',
                      }}>
                        {ev.organizer.split(' ').map(w => w[0]).join('')}
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

          {/* Infinite scroll sentinel + loader */}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
          {loading && (
            <div className="feed-loader"><span className="feed-spinner" /> Loading more events…</div>
          )}
          {!hasMore && <p className="feed-end">You’re all caught up 🎉</p>}
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => navigate('/guest/feed')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/empty')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Search</span>
          </button>
          <button className="nav-center-btn" onClick={() => navigate('/create-event')}>
            <Plus size={24} />
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/join')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Saved</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {toast && (
          <div style={{
            position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '10px 18px',
            borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 100, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
