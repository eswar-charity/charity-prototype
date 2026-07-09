import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function DesktopFooter() {
  const navigate = useNavigate();
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

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
          <span className="dsk-footer-link" onClick={() => showToast('Company page — coming soon')}>Company</span>
          <span className="dsk-footer-link" onClick={() => showToast('Legal & policies — coming soon')}>Legal</span>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '12px 18px',
            borderRadius: 999, fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200, whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </footer>
  );
}
