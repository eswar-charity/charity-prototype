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
            <img
              src="/events/neon-night/img2.jpg"
              alt="Neon Night Run"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* dim overlay bottom */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
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
              Neon Night Run
            </h1>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              <MapPin size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Prospect Park, Brooklyn NY</span>
            </div>

            {/* Nonprofit row */}
            <div className="np-info-row">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#D32F2F,#EF5350)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>YH</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Youth Health Fund</p>
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
              Join us for an electrifying night run through Prospect Park. Grab your glow gear and help us raise funds for youth fitness programs. Every finish line crossed supports a kid's access to sports.
            </p>

            {/* Photo grid */}
            <div className="photo-grid-2">
              <div style={{ backgroundImage: 'url(/events/neon-night/img3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ backgroundImage: 'url(/events/neon-night/img4.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
              <div className="la-avatar" style={{ background: 'linear-gradient(135deg,#F5604A,#FF8A65)' }}>PM</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Priya M. just crossed the start line</p>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0, marginLeft: 6 }}>2 min ago</span>
                </div>
              </div>
            </div>

            <div className="live-activity-item">
              <div className="la-avatar" style={{ background: 'linear-gradient(135deg,#D32F2F,#EF5350)' }}>YH</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    Youth Health Fund{' '}
                    <span style={{
                      display: 'inline-flex', width: 13, height: 13, borderRadius: '50%',
                      background: 'var(--blue)', color: 'white', fontSize: 8,
                      alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                    }}>✓</span>
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0, marginLeft: 6 }}>15 min ago</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5, marginBottom: 8 }}>
                  The glow station is open! Grab your wristbands at the main tent. Let's hit 100 backers tonight!
                </p>
                <div style={{
                  height: 90, borderRadius: 10,
                  backgroundImage: 'url(/events/neon-night/img5.jpg)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
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
