import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, ChevronRight, Rocket, Users } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import MobileAppHeader from '../components/MobileAppHeader';

export default function PostEventImpact() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const shareToLinkedIn = () => {
    const link = 'https://charityhub.app/e/neon-night-run';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(
        () => showToast('Impact link copied — ready to share'),
        () => showToast('Impact link ready to share')
      );
    } else {
      showToast('Impact link ready to share');
    }
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader homePath="/feed" />
          <div style={{ padding: '0 18px 24px' }}>
          {/* Header copy */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>You made this happen</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
              Neon Night Run · Nov 8, 2025
            </p>
          </div>

          {/* Stats row */}
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <div className="stat-box">
              <div className="stat-num">213</div>
              <div className="stat-lbl">People backed</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">87</div>
              <div className="stat-lbl">Joined in person</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">38</div>
              <div className="stat-lbl">Live updates</div>
            </div>
          </div>

          {/* Thank you card */}
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 16 }}>—</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                Thank you, Sarah!{' '}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'var(--blue)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  justifyContent: 'center',
                  verticalAlign: 'middle',
                }}>✓</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your event brought real people to this cause. We're grateful.
              </p>
            </div>
          </div>

          {/* Credential card */}
          <div className="credential-card" style={{ marginBottom: 20 }}>
            {/* Decorative blur circles */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: 20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            }} />

            {/* Charity Hub label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: 'white',
              }}>
                CH
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Charity Hub</span>
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                letterSpacing: 0.5,
              }}>
                OFFICIAL EVENT ORGANISER
              </span>
            </div>

            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
              }}>
                SJ
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Sarah Jenkins</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Neon Night Run</p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 16, position: 'relative' }}>
              213 participants · Youth Health Fund · Nov 2025
            </p>

            {/* Share + settings row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <button
                onClick={shareToLinkedIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                Share to LinkedIn <Share2 size={15} />
              </button>
              <button
                onClick={() => navigate('/profile')}
                aria-label="Credential settings"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: 10,
                }}
              >
                <Settings size={16} color="white" />
              </button>
            </div>
          </div>

          {/* Keep momentum section */}
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14 }}>
            Keep the momentum going
          </p>

          <div
            className="keep-row"
            role="button"
            tabIndex={0}
            aria-label="Create your next event"
            onClick={() => navigate('/event/step-1')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/event/step-1');
              }
            }}
          >
            <div className="keep-icon-circle" style={{ background: 'var(--primary-soft)' }}>
              <Rocket size={20} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Create your next event</p>
            </div>
            <ChevronRight size={18} color="var(--text-light)" />
          </div>

          <div
            className="keep-row"
            role="button"
            tabIndex={0}
            aria-label="Explore other events"
            onClick={() => navigate('/feed')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/feed');
              }
            }}
          >
            <div className="keep-icon-circle" style={{ background: 'var(--blue-soft)' }}>
              <Users size={20} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Explore other events</p>
            </div>
            <ChevronRight size={18} color="var(--text-light)" />
          </div>
        </div>
        </div>

        <BottomNav active="activity" onPlusClick={() => navigate('/create-event')} />
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
