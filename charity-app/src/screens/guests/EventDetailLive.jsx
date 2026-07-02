import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bookmark, MapPin, Share2, Heart, Clock } from 'lucide-react';

const BACKER_COLORS = ['#F5604A', '#0D7377', '#7B1FA2', '#1976D2', '#F57C00', '#D32F2F'];

export default function EventDetailLive() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          {/* Hero */}
          <div className="detail-hero" style={{ height: 260 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg,#FF8C42 0%,#F5604A 30%,#2C4B6E 65%,#1A2F48 100%)',
            }} />
            {/* dim overlay bottom */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
            }} />

            {/* Top nav */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '48px 16px 0',
            }}>
              <button className="back-btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                onClick={() => navigate('/guest/feed')}>
                <ChevronLeft size={18} color="white" />
              </button>
              <button
                onClick={() => setSaved(!saved)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                <Bookmark size={18} color="white" fill={saved ? 'white' : 'none'} />
              </button>
            </div>

            {/* Bottom badges */}
            <div style={{
              position: 'absolute', bottom: 42, left: 14,
              display: 'flex', gap: 8,
            }}>
              <span className="live-badge">
                <span className="live-dot" />
                LIVE NOW
              </span>
              <span className="hero-pill">
                <Clock size={11} />
                TODAY · 4PM–7PM
              </span>
            </div>
          </div>

          {/* White detail card */}
          <div className="detail-card">
            {/* Title */}
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              Ocean Coastal Restoration
            </h1>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              <MapPin size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Half Moon Bay, CA</span>
            </div>

            {/* Nonprofit row */}
            <div className="np-info-row">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#0D7377,#14A085)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>OC</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Ocean Conservancy</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Nonprofit</p>
              </div>
              <button className="btn-ghost" style={{ fontSize: 13 }}>Learn more</button>
            </div>

            {/* Backers */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 16,
            }}>
              <div className="av-stack">
                {BACKER_COLORS.map((c, i) => (
                  <div key={i} className="av" style={{ background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
                213 people are backing this
              </span>
            </div>

            {/* The Mission */}
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
              The Mission
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 4 }}>
              Join us for an urgent coastal restoration initiative. We're clearing debris, planting native dune grasses, and restoring vital nesting habitats for endangered sea turtles before the nesting season begins.
            </p>

            {/* Photo grid */}
            <div className="photo-grid-2">
              <div style={{ background: 'linear-gradient(135deg,#795548 0%,#BCAAA4 100%)' }} />
              <div style={{ background: 'linear-gradient(160deg,#FF8C42 0%,#F5604A 50%,#2C4B6E 100%)' }} />
            </div>

            {/* Live Activity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Live Activity</p>
              <span className="live-badge" style={{ fontSize: 10 }}>
                <span className="live-dot" />
                Live
              </span>
            </div>

            <div className="live-activity-item">
              <div className="la-avatar" style={{ background: 'linear-gradient(135deg,#F5604A,#FF8A65)' }}>SM</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Sarah M. joined the cleanup crew</p>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0, marginLeft: 6 }}>2 min ago</span>
                </div>
              </div>
            </div>

            <div className="live-activity-item">
              <div className="la-avatar" style={{ background: 'linear-gradient(135deg,#0D7377,#14A085)' }}>OC</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    Ocean Conservancy{' '}
                    <span style={{
                      display: 'inline-flex', width: 13, height: 13, borderRadius: '50%',
                      background: 'var(--blue)', color: 'white', fontSize: 8,
                      alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                    }}>✓</span>
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0, marginLeft: 6 }}>15 min ago</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5, marginBottom: 8 }}>
                  Basecamp is set up! Grab your gloves and bags at the main tent.
                </p>
                <div style={{
                  height: 90, borderRadius: 10,
                  background: 'linear-gradient(160deg,#795548 0%,#BCAAA4 50%,#E8C4B8 100%)',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="event-bar">
          <button
            className="event-bar-icon"
            onClick={() => navigate('/guest/share')}
          >
            <Share2 size={18} color="var(--dark)" />
          </button>
          <button
            className="event-bar-btn"
            onClick={() => navigate('/guest/donate')}
          >
            Back this event
          </button>
          <button
            className="event-bar-icon"
            onClick={() => setLiked(!liked)}
          >
            <Heart size={18} color={liked ? 'var(--primary)' : 'var(--dark)'} fill={liked ? 'var(--primary)' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
