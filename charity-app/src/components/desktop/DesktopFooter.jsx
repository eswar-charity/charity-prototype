import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function DesktopFooter() {
  const navigate = useNavigate();
  const [showLegal, setShowLegal] = useState(false);

  return (
    <footer className="dsk-footer">
      <div className="dsk-footer-inner">
        <div className="dsk-footer-brand">
          <Logo height={26} tone="dark" onClick={() => navigate('/guest/feed')} style={{ cursor: 'pointer' }} />
          <p className="dsk-footer-tagline">
            Empowering communities through meaningful connections and impactful events. Join the movement.
          </p>
          <p className="dsk-footer-copy">© Charity Hub. Competition for Good®</p>
        </div>

        <div className="dsk-footer-col">
          <p className="dsk-footer-heading">Explore</p>
          <span className="dsk-footer-link" onClick={() => navigate('/guest/feed')}>Product</span>
          <span className="dsk-footer-link" onClick={() => navigate('/guest/feed')}>Causes</span>
        </div>

        <div className="dsk-footer-col">
          <p className="dsk-footer-heading">About</p>
          <span className="dsk-footer-link" onClick={() => navigate('/np/profile')}>Company</span>
          <span className="dsk-footer-link" onClick={() => setShowLegal((v) => !v)}>Legal</span>
        </div>
      </div>

      {showLegal && (
        <div className="dsk-footer-legal" style={{
          maxWidth: 960, margin: '0 auto', padding: '16px 24px 0',
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <p style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>Privacy &amp; Terms</p>
          <p>
            Charity Hub processes donations through verified 501(c)(3) partners. Event content is moderated
            before publication. By using the platform you agree to our community guidelines and nonprofit
            partnership terms.
          </p>
        </div>
      )}
    </footer>
  );
}
