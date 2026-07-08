import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Megaphone, Building2, Compass } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { events } from '../data/mockData';

const FILTERS = ['All', 'You', 'Live now', 'Environment', 'Education'];

export default function FeedScreen() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSheet, setShowSheet] = useState(false);

  return (
    <div className="phone-shell">
      <div className="screen screen--split">

        {/* ── Fixed top section (does NOT scroll) ── */}
        <div className="screen-top">
          <div className="scene-header">
            <div>
              <h1 className="scene-title">The Scene</h1>
              <p className="scene-subtitle">Events happening now</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={22} color="var(--dark)" style={{ cursor: 'pointer' }} />
              <div className="scene-avatar">SJ</div>
            </div>
          </div>

          {/* Story circles */}
          <div className="story-row">
            <div className="story-item" onClick={() => setShowSheet(true)}>
              <div className="story-circle yours">
                <Plus size={22} color="var(--primary)" />
              </div>
              <span className="story-label">Your Event</span>
            </div>
            {events.slice(0, 4).map((ev) => (
              <div key={ev.id} className="story-item" onClick={() => navigate('/guest/event/live')}>
                <div className="story-circle">
                  <img src={ev.cover} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="story-label">{ev.title.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            ))}
          </div>

          {/* Filter chips */}
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
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

          {/* Proto flow switcher */}
          <div style={{ display: 'flex', gap: 8, padding: '0 18px 14px' }}>
            <button
              onClick={() => navigate('/guest/feed')}
              style={{
                flex: 1, padding: '7px 0', background: 'var(--blue)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Guest Flow →
            </button>
            <button
              onClick={() => navigate('/np/home')}
              style={{
                flex: 1, padding: '7px 0', background: '#0D9488',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              NP Flow →
            </button>
          </div>
        </div>

        {/* ── Scrollable feed cards ONLY ── */}
        <div className="screen-scroll">
          <div style={{ padding: '0 16px 16px' }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              className="scene-card"
              onClick={() => navigate('/guest/event/live')}
            >
              {/* Hero image */}
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
                  <span className="scene-live-badge" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    {ev.category.toUpperCase()}
                  </span>
                )}
                <div className="scene-card-overlay">
                  <h3 className="scene-card-title">#{ev.title.replace(/[\s,''']+/g, '')}</h3>
                  <p className="scene-card-desc">{ev.subtitle}</p>
                </div>
              </div>

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
                    {['#F5604A', '#0D7377', '#7B1FA2'].map((c, i) => (
                      <div key={i} className="av" style={{ background: c, width: 18, height: 18, fontSize: 8 }} />
                    ))}
                  </div>
                  <span className="scene-stat">{ev.backed} <span className="scene-stat-lbl">backing</span></span>
                  <span className="scene-stat-sep">·</span>
                  <span className="scene-stat">💬 {ev.chatCount} <span className="scene-stat-lbl">in chat</span></span>
                  <span className="scene-stat-sep">·</span>
                  <span className="scene-stat">📸 {ev.updates} <span className="scene-stat-lbl">moments</span></span>
                </div>
              </div>
            </div>
          ))}
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

            <div className="opt-row" onClick={() => { setShowSheet(false); navigate('/event/step-1'); }}>
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

            <div className="opt-row" onClick={() => setShowSheet(false)}>
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
