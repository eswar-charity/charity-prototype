import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Users, Heart, Calendar, Globe } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import Logo from '../../components/Logo';

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

const HERO_OPTIONS = [
  '/events/breakneck-ridge-run/img1.jpg',
  '/events/give-now/img1.jpg',
  '/events/neon-night/img1.jpg',
];
const LOGO_OPTIONS = [
  '/events/breakneck-ridge-run/img1.jpg',
  '/events/dog-dad/img1.jpg',
  '/events/golf-outing/img1.jpg',
];

const IMPACT = [
  { num: '12k+', label: 'Supporters', Icon: Users },
  { num: '$2.4M', label: 'Raised Total', Icon: Heart },
  { num: '15', label: 'Active Events', Icon: Calendar },
  { num: '8', label: 'Countries', Icon: Globe },
];

export default function NpProfile() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [coverIdx, setCoverIdx] = useState(0);
  const [logoIdx, setLogoIdx] = useState(0);
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const cycleCover = () => {
    setCoverIdx((i) => (i + 1) % HERO_OPTIONS.length);
    notify('Cover photo updated');
  };

  const cycleLogo = () => {
    setLogoIdx((i) => (i + 1) % LOGO_OPTIONS.length);
    notify('Organization logo updated');
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <div className="np-profile-hero">
            <img className="np-profile-hero-img" src={HERO_OPTIONS[coverIdx]} alt="" />
            <div className="np-profile-hero-nav">
              <button type="button" className="np-profile-hero-btn" onClick={() => navigate('/np/home')} aria-label="Back">
                <ChevronLeft size={18} color="white" />
              </button>
              <div className="np-profile-hero-logo">
                <Logo height={20} />
              </div>
              <button
                type="button"
                className="np-profile-hero-btn"
                aria-label="Edit cover"
                onClick={cycleCover}
              >
                <Pencil size={16} color="white" />
              </button>
            </div>
          </div>

          <div className="np-profile-body">
            <div className="card np-profile-card">
              <div className="np-profile-avatar-wrap">
                <div className="np-profile-avatar">
                  <img src={LOGO_OPTIONS[logoIdx]} alt="Ocean Conservancy" />
                  <button
                    type="button"
                    className="np-profile-avatar-edit"
                    aria-label="Edit logo"
                    onClick={cycleLogo}
                  >
                    <Pencil size={11} color="white" />
                  </button>
                </div>
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 8, letterSpacing: -0.3 }}>
                Ocean Conservancy
              </h1>
              <span className="np-verified-badge">✓ Verified 501(c)(3)</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 12 }}>
                Protecting the ocean from today&apos;s greatest global challenges. Est. 1969 · Washington D.C.
              </p>
            </div>

            <div className="np-mission-heading">
              <span className="np-mission-quotes">&ldquo;</span>
              Our Mission
            </div>
            <div className="mission-block" style={{ background: 'white', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.65, fontStyle: 'italic' }}>
                Working with you to protect the ocean from today&apos;s greatest global challenges. Together, we create science-based solutions for a healthy ocean and the wildlife and communities that depend on it.
              </p>
            </div>

            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Our Impact</p>
            <div className="impact-grid" style={{ marginBottom: 8 }}>
              {IMPACT.map((item) => (
                <div key={item.label} className="impact-box">
                  <item.Icon size={16} color="var(--text-secondary)" aria-hidden={true} />
                  <div className="impact-num">{item.num}</div>
                  <div className="impact-lbl">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <NpBottomNav active="profile" />
        {toast && <div style={TOAST_STYLE}>{toast}</div>}
      </div>
    </div>
  );
}
