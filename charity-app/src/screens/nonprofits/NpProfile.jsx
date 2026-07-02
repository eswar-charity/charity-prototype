import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Pencil, MapPin, ChevronRight, Heart } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const IMPACT = [
  { num: '12k+', label: 'Supporters', icon: '👥' },
  { num: '$2.4M', label: 'Raised Total', icon: '💝' },
  { num: '15', label: 'Active Events', icon: '📅' },
  { num: '8', label: 'Countries', icon: '🌍' },
];

const RECENT_EVENTS = [
  { id: 1, title: 'Annual Beach Cleanup', meta: 'Oct 12 · Miami, FL', bg: 'linear-gradient(135deg,#FF8C42,#F5604A)' },
  { id: 2, title: 'Ocean Science Gala', meta: 'Nov 05 · Virtual', bg: 'linear-gradient(135deg,#0D7377,#14A085)' },
];

export default function NpProfile() {
  const navigate = useNavigate();

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Hero */}
        <div style={{ position: 'relative', height: 200 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg,#FF8C42 0%,#E05C20 35%,#2C4B6E 70%,#1A2F48 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 100%)',
          }} />

          {/* Top nav */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between',
            padding: '48px 16px 0',
          }}>
            <button
              className="back-btn"
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
              onClick={() => navigate('/np/home')}
            >
              <ChevronLeft size={18} color="white" />
            </button>
            <button
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Share2 size={18} color="white" />
            </button>
          </div>

          {/* Edit pencil */}
          <button style={{
            position: 'absolute', bottom: 50, right: 14,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Pencil size={14} color="white" />
          </button>
        </div>

        {/* Profile card — overlaps hero */}
        <div style={{ padding: '0 18px' }}>
          <div className="card" style={{ marginTop: -36, marginBottom: 16, textAlign: 'center', padding: '48px 18px 20px', position: 'relative' }}>
            {/* Logo circle */}
            <div style={{
              position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0D7377,#14A085)',
              border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}>OC</div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 6, letterSpacing: -0.3 }}>
              Ocean Conservancy
            </h1>
            <span className="verified-badge" style={{ marginBottom: 10, display: 'inline-flex' }}>
              ✓ Verified 501(c)(3)
            </span>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 6 }}>
              Protecting the world's greatest global challenges. Est. 1969 · Washington D.C.
            </p>
          </div>

          {/* Our Mission */}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
            Our Mission
          </p>
          <div className="mission-block" style={{ marginBottom: 20 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, color: 'var(--primary)',
              lineHeight: 0.8, display: 'block', marginBottom: 8, fontFamily: 'Georgia, serif',
            }}>"</span>
            <p style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.65, fontStyle: 'italic' }}>
              Working with you to protect the ocean from today's greatest global challenges. Together, we create science-based solutions for a healthy ocean and the wildlife and communities that depend on it.
            </p>
          </div>

          {/* Our Impact */}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Our Impact</p>
          <div className="impact-grid" style={{ marginBottom: 20 }}>
            {IMPACT.map((item) => (
              <div key={item.label} className="impact-box">
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div className="impact-num">{item.num}</div>
                <div className="impact-lbl">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Events */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Recent Events</p>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/np/approvals')}>
              View All
            </button>
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            {RECENT_EVENTS.map((ev) => (
              <div
                key={ev.id}
                className="recent-event-row"
                onClick={() => navigate('/np/approvals/review')}
              >
                <div className="recent-thumb" style={{ background: ev.bg }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{ev.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.meta}</p>
                </div>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            ))}
          </div>

          {/* Support CTA */}
          <button
            className="btn-primary"
            style={{ marginBottom: 8 }}
            onClick={() => navigate('/guest/donate')}
          >
            <Heart size={16} /> Support Our Cause
          </button>
        </div>

        <NpBottomNav active="home" />
      </div>
    </div>
  );
}
