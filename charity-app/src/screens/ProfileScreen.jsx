import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, MapPin, ChevronRight, Share2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import MobileAppHeader from '../components/MobileAppHeader';
import { events } from '../data/mockData';

const RECENT_EVENTS = events.slice(0, 3);

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const handleShare = () => {
    const link = `${window.location.origin}/profile`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setToast('Profile link copied');
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            homePath="/feed"
            title="Profile"
            actions={(
              <button
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'white', border: 'none', boxShadow: 'var(--card-shadow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
                aria-label="Share profile"
                onClick={handleShare}
              >
                <Share2 size={18} color="var(--dark)" />
              </button>
            )}
          />
          <div style={{ padding: '0 18px 24px' }}>

            <div className="card" style={{ textAlign: 'center', padding: '24px 18px 20px', marginBottom: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--primary),var(--blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: 'white',
                margin: '0 auto 12px',
              }}>SJ</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Sarah Jenkins</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Social Entrepreneur</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                <MapPin size={13} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>San Francisco, CA</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                Creating events that bring communities together for causes that matter.
              </p>
              <button
                className="btn-outline"
                style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}
                onClick={() => navigate('/about-you')}
              >
                <Pencil size={14} /> Edit profile
              </button>
            </div>

            <div className="stat-row" style={{ marginBottom: 20 }}>
              <div className="stat-box">
                <div className="stat-num">5</div>
                <div className="stat-lbl">Events hosted</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">847</div>
                <div className="stat-lbl">People reached</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">$12k</div>
                <div className="stat-lbl">Raised</div>
              </div>
            </div>

            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Your events</p>
            <div className="card" style={{ marginBottom: 16 }}>
              {RECENT_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="recent-event-row"
                  onClick={() => navigate('/post-event')}
                >
                  <div
                    className="recent-thumb"
                    style={{ backgroundImage: `url(${ev.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>{ev.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.nonprofit} · {ev.backed} backing</p>
                  </div>
                  <ChevronRight size={16} color="var(--text-light)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <BottomNav active="profile" onPlusClick={() => navigate('/create-event')} />
      </div>

      {/* ── Lightweight toast ── */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 92,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: 'var(--card-shadow)',
            zIndex: 50,
            whiteSpace: 'nowrap',
            maxWidth: '90%',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
