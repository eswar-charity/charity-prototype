import { useLocation } from 'react-router-dom';
import { events } from '../../data/mockData';
import Logo from '../Logo';

const live = events.find((e) => e.isLive) || events[0];

export default function DesktopAuthLayout({ eyebrow, headline, subhead, children }) {
  const { pathname } = useLocation();

  return (
    <div className="dsk-page dsk-auth-page">
      <div className="dsk-auth-hero" style={{ backgroundImage: `url(${live.cover})` }}>
        <div className="dsk-auth-hero-scrim" />
        <div className="dsk-auth-hero-content">
          <div>
            <p className="dsk-auth-eyebrow">{eyebrow}</p>
            <h1 className="dsk-auth-headline">{headline}</h1>
            <p className="dsk-auth-subhead">{subhead}</p>

            <div className="dsk-auth-live-chip">
              <span className="live-dot" />
              <span className="dsk-auth-live-label">LIVE NOW</span>
              <span className="dsk-auth-live-title">{live.title}</span>
              <span className="dsk-auth-live-sep">·</span>
              <span>{live.backed} backing</span>
              <span className="dsk-auth-live-sep">·</span>
              <span>{live.chatCount} in chat</span>
            </div>
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
