import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Users, Heart, Calendar, Globe } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import { useNpProfile } from '../../hooks/useNpProfile';

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

const IMPACT = [
  { num: '12k+', label: 'Supporters', Icon: Users },
  { num: '$2.4M', label: 'Raised Total', Icon: Heart },
  { num: '15', label: 'Active Events', Icon: Calendar },
  { num: '8', label: 'Countries', Icon: Globe },
];

export default function NpProfile() {
  const navigate = useNavigate();
  const { profile, loading, error, cycleCover, cycleLogo } = useNpProfile();
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const handleCycleCover = async () => {
    try {
      await cycleCover();
      notify('Cover photo updated');
    } catch {
      notify('Could not update cover photo');
    }
  };

  const handleCycleLogo = async () => {
    try {
      await cycleLogo();
      notify('Organization logo updated');
    } catch {
      notify('Could not update logo');
    }
  };

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load profile'}
        </div>
      </div>
    );
  }

  const verifiedLabel = profile.verified ? '✓ Verified 501(c)(3)' : 'Organization profile';

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <div className="np-profile-hero">
            <img className="np-profile-hero-img" src={profile.coverImage} alt="" />
            <div className="np-profile-hero-nav">
              <button type="button" className="np-profile-hero-btn" onClick={() => navigate('/np/home')} aria-label="Back">
                <ChevronLeft size={18} color="white" />
              </button>
              <button
                type="button"
                className="np-profile-hero-btn"
                aria-label="Edit cover"
                onClick={handleCycleCover}
              >
                <Pencil size={16} color="white" />
              </button>
            </div>
          </div>

          <div className="np-profile-body">
            <div className="card np-profile-card">
              <div className="np-profile-avatar-wrap">
                <div className="np-profile-avatar">
                  <img src={profile.logoImage} alt={profile.name} />
                  <button
                    type="button"
                    className="np-profile-avatar-edit"
                    aria-label="Edit logo"
                    onClick={handleCycleLogo}
                  >
                    <Pencil size={11} color="white" />
                  </button>
                </div>
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 8, letterSpacing: -0.3 }}>
                {profile.name}
              </h1>
              <span className="np-verified-badge">{verifiedLabel}</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 12 }}>
                {profile.tagline}
              </p>
            </div>

            <div className="np-mission-heading">
              <span className="np-mission-quotes">&ldquo;</span>
              Our Mission
            </div>
            <div className="mission-block" style={{ background: 'white', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.65, fontStyle: 'italic' }}>
                {profile.mission || 'No mission statement yet.'}
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
