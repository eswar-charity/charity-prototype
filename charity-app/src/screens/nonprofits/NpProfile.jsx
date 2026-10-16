import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Users, Heart, Calendar } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import { useNpProfile } from '../../hooks/useNpProfile';

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;

export default function NpProfile() {
  const navigate = useNavigate();
  const { profile, loading, error, saving, uploadCover, uploadLogo } = useNpProfile();
  const coverInput = useRef(null);
  const logoInput = useRef(null);
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const pick = (upload, okMsg, failMsg) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await upload(file);
      notify(okMsg);
    } catch (err) {
      notify(err?.message || failMsg);
    }
  };
  const handleCover = pick(uploadCover, 'Cover photo updated', 'Could not update cover photo');
  const handleLogo = pick(uploadLogo, 'Organization logo updated', 'Could not update logo');

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
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={handleCover} />
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={handleLogo} />
          <div className="np-profile-hero">
            {profile.coverImage ? (
              <img className="np-profile-hero-img" src={profile.coverImage} alt="" />
            ) : (
              <div className="np-profile-hero-img" style={{ background: `linear-gradient(135deg, ${profile.color}, #0A2E52)` }} />
            )}
            <div className="np-profile-hero-nav">
              <button type="button" className="np-profile-hero-btn" onClick={() => navigate('/np/home')} aria-label="Back">
                <ChevronLeft size={18} color="white" />
              </button>
              <button
                type="button"
                className="np-profile-hero-btn"
                aria-label="Edit cover"
                disabled={saving}
                onClick={() => coverInput.current?.click()}
              >
                <Pencil size={16} color="white" />
              </button>
            </div>
          </div>

          <div className="np-profile-body">
            <div className="card np-profile-card">
              <div className="np-profile-avatar-wrap">
                <div className="np-profile-avatar">
                  {profile.logoImage ? (
                    <img src={profile.logoImage} alt={profile.name} />
                  ) : (
                    <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', background: profile.color, color: '#fff', fontWeight: 800, fontSize: 22 }}>
                      {profile.initials}
                    </span>
                  )}
                  <button
                    type="button"
                    className="np-profile-avatar-edit"
                    aria-label="Edit logo"
                    disabled={saving}
                    onClick={() => logoInput.current?.click()}
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
              {[
                { num: Number(profile.stats.totalBacked).toLocaleString('en-US'), label: 'Supporters', Icon: Users },
                { num: money(profile.stats.totalRaised), label: 'Raised Total', Icon: Heart },
                { num: String(profile.stats.eventsHosted), label: 'Events Hosted', Icon: Calendar },
              ].map((item) => (
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
