import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bookmark, MapPin, Share2, Heart, Calendar, ChevronRight } from 'lucide-react';

const BACKER_COLORS = ['#F5604A', '#0D7377', '#7B1FA2', '#1976D2', '#F57C00'];

export default function EventDetailUpcoming() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <div className="phone-shell">
      <div className="detail-screen">
        <div className="detail-scroll">
          {/* Hero */}
          <div className="detail-hero" style={{ height: 240 }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg,#4A6741 0%,#5A7A52 35%,#8B9B6A 70%,#C0B280 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)',
            }} />

            {/* Top nav */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '48px 16px 0',
            }}>
              <button
                className="back-btn"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                onClick={() => navigate('/guest/feed')}
              >
                <ChevronLeft size={18} color="white" />
              </button>
              <button
                onClick={() => setSaved(!saved)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <Bookmark size={18} color="white" fill={saved ? 'white' : 'none'} />
              </button>
            </div>

            {/* Date + location pills */}
            <div style={{
              position: 'absolute', bottom: 42, left: 14, display: 'flex', gap: 8,
            }}>
              <span className="hero-pill coral">
                <Calendar size={10} />
                Oct 14 · 9AM
              </span>
              <span className="hero-pill coral">
                <MapPin size={10} />
                New York
              </span>
            </div>
          </div>

          {/* White detail card */}
          <div className="detail-card">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              Urban Garden Harvest
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
              <MapPin size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Brooklyn, NY</span>
            </div>

            {/* Nonprofit row */}
            <div className="np-info-row">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#388E3C,#66BB6A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>GE</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Green Earth Project</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Nonprofit</p>
              </div>
              <button className="btn-ghost" style={{ fontSize: 13 }}>Learn more</button>
            </div>

            {/* Backers */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 0,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="av-stack">
                  {BACKER_COLORS.map((c, i) => (
                    <div key={i} className="av" style={{ background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
                  145 people are backing this
                </span>
              </div>
              <ChevronRight size={16} color="var(--text-light)" />
            </div>

            {/* Organiser */}
            <div className="organiser-row">
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F5604A,#FF8A65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>SJ</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                  Sarah Jenkins{' '}
                  <span style={{
                    display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--blue)', color: 'white', fontSize: 9,
                    alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                  }}>✓</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Organiser</p>
              </div>
              <button
                className="follow-btn"
                onClick={() => setFollowing(!following)}
                style={following ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* The Mission */}
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
              The Mission
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Join us for our community garden harvest. We're gathering seasonal produce to distribute to local food pantries. No experience needed — just bring your energy and a pair of gloves.
            </p>

            {/* Photo grid */}
            <div className="photo-grid-2">
              <div style={{ background: 'linear-gradient(135deg,#388E3C 0%,#66BB6A 100%)' }} />
              <div style={{ background: 'linear-gradient(160deg,#8BC34A 0%,#F9A825 100%)' }} />
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="event-bar">
          <button className="event-bar-icon" onClick={() => navigate('/guest/share')}>
            <Share2 size={18} color="var(--dark)" />
          </button>
          <button className="event-bar-btn" onClick={() => navigate('/guest/join')}>
            Back this event
          </button>
          <button className="event-bar-icon" onClick={() => setLiked(!liked)}>
            <Heart size={18} color={liked ? 'var(--primary)' : 'var(--dark)'} fill={liked ? 'var(--primary)' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
