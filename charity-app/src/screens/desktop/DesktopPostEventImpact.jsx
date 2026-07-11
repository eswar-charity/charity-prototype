import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, ChevronRight, Rocket, Users, Award } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import DesktopShareModal from '../../components/desktop/DesktopShareModal';
import Logo from '../../components/Logo';

export default function DesktopPostEventImpact() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [showShare, setShowShare] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" />

      <main className="dsk-main">
        <div className="dsk-container dsk-post-event-wrap">
          <div className="dsk-post-event-head">
            <p className="dsk-post-event-eyebrow">You made this happen</p>
            <h1 className="dsk-post-event-title">Neon Night Run</h1>
            <p className="dsk-post-event-subtitle">Nov 8, 2025 · Youth Health Fund</p>
          </div>

          <div className="dsk-post-event-stats">
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

          <div className="dsk-post-event-grid">
            <div className="credential-card dsk-post-event-credential">
              <div className="dsk-post-event-credential-brand">
                <Logo height={22} />
                <span className="dsk-post-event-credential-badge">OFFICIAL EVENT ORGANISER</span>
              </div>

              <div className="dsk-post-event-credential-user">
                <div className="dsk-post-event-credential-avatar">SJ</div>
                <div>
                  <p className="dsk-post-event-credential-name">Sarah Jenkins</p>
                  <p className="dsk-post-event-credential-event">Neon Night Run</p>
                </div>
              </div>

              <p className="dsk-post-event-credential-meta">213 participants · Youth Health Fund · Nov 2025</p>

              <div className="dsk-post-event-credential-actions">
                <button type="button" className="dsk-post-event-share-btn" onClick={() => setShowShare(true)}>
                  Share your impact <Share2 size={15} />
                </button>
                <button
                  type="button"
                  className="dsk-post-event-settings-btn"
                  onClick={() => navigate('/profile')}
                  aria-label="Credential settings"
                >
                  <Settings size={16} color="var(--primary)" />
                </button>
              </div>
            </div>

            <div className="dsk-post-event-side">
              <div className="card dsk-post-event-thanks">
                <div className="dsk-post-event-thanks-icon"><Award size={24} color="var(--primary)" /></div>
                <div>
                  <p className="dsk-post-event-thanks-title">
                    Thank you, Sarah! <span className="dsk-verify-dot">✓</span>
                  </p>
                  <p className="dsk-post-event-thanks-text">
                    Your event brought real people to this cause. We&apos;re grateful.
                  </p>
                </div>
              </div>

              <div className="dsk-post-event-next">
                <p className="dsk-post-event-next-title">Keep the momentum going</p>

                <button type="button" className="keep-row" onClick={() => navigate('/event/step-1')}>
                  <div className="keep-icon-circle" style={{ background: 'var(--primary-soft)' }}>
                    <Rocket size={20} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Create your next event</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </button>

                <button type="button" className="keep-row" onClick={() => navigate('/feed')}>
                  <div className="keep-icon-circle" style={{ background: 'var(--blue-soft)' }}>
                    <Users size={20} color="var(--blue)" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Explore other events</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DesktopFooter />

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url="https://charityhub.app/e/neon-night-run"
          title="Neon Night Run — Impact Recap"
          subtitle="213 participants · Youth Health Fund"
        />
      )}

      {toast && (
        <div className="dsk-post-event-toast">{toast}</div>
      )}
    </div>
  );
}
