import { useLocation } from 'react-router-dom';
import Logo from '../Logo';
import useSpotlightEvent from '../../hooks/useSpotlightEvent';

export default function DesktopAuthLayout({ eyebrow, headline, subhead, children }) {
  const { pathname } = useLocation();
  const { event: live } = useSpotlightEvent();

  return (
    <div className="dsk-page dsk-auth-page">
      <div className="dsk-auth-hero" style={live ? { backgroundImage: `url(${live.cover})` } : { background: 'linear-gradient(135deg,#0A2E52,#1A6EB5)' }}>
        <div className="dsk-auth-hero-scrim" />
        <div className="dsk-auth-hero-content">
          <div>
            <p className="dsk-auth-eyebrow">{eyebrow}</p>
            <h1 className="dsk-auth-headline">{headline}</h1>
            <p className="dsk-auth-subhead">{subhead}</p>

            {live && (
              <div className="dsk-auth-live-chip">
                <span className="live-dot" />
                <span className="dsk-auth-live-label">LIVE NOW</span>
                <span className="dsk-auth-live-title">{live.title}</span>
                <span className="dsk-auth-live-sep">·</span>
                <span>{live.backed} backing</span>
                <span className="dsk-auth-live-sep">·</span>
                <span>{live.chat} in chat</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dsk-auth-form-side">
        <div className="dsk-auth-form-card">
          <Logo
            height={38}
            tone="dark"
            linkToFeed={pathname !== '/'}
            style={{ marginBottom: 28, cursor: pathname !== '/' ? 'pointer' : undefined }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
