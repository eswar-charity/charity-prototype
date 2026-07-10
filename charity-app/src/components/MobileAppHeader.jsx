import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

function LogoButton({ homePath, height = 22 }) {
  const navigate = useNavigate();

  if (!homePath) {
    return <Logo height={height} />;
  }

  return (
    <button
      type="button"
      className="mobile-app-header-logo-btn"
      onClick={() => navigate(homePath)}
      aria-label="Charity Hub home"
    >
      <Logo height={height} />
    </button>
  );
}

/**
 * Mobile app chrome with Charity Hub logo.
 * layout: feed (logo left) | bar (logo center) | center (logo between left/actions)
 */
export default function MobileAppHeader({
  layout = 'feed',
  homePath,
  left,
  actions,
  title,
  subtitle,
  meta,
  className = '',
  logoHeight = 22,
}) {
  const isBar = layout === 'bar';
  const isCenter = layout === 'center';

  if (isBar || isCenter) {
    return (
      <header className={`mobile-app-header mobile-app-header--${layout} ${className}`.trim()}>
        <div className="mobile-app-header-bar">
          <div className="mobile-app-header-bar-side">{left}</div>
          <div className="mobile-app-header-bar-logo">
            <LogoButton homePath={homePath} height={logoHeight} />
          </div>
          <div className="mobile-app-header-bar-side mobile-app-header-bar-side--end">
            {actions ?? <div className="mobile-auth-top-spacer" aria-hidden />}
          </div>
        </div>
        {meta && <p className="mobile-app-header-meta">{meta}</p>}
        {(title || subtitle) && (
          <div className="mobile-app-header-copy">
            {title && <h1 className="mobile-app-header-title">{title}</h1>}
            {subtitle && <p className="mobile-app-header-subtitle">{subtitle}</p>}
          </div>
        )}
      </header>
    );
  }

  return (
    <header className={`mobile-app-header ${className}`.trim()}>
      <div className="mobile-app-header-row">
        <div className="mobile-app-header-brand">
          {left ?? <LogoButton homePath={homePath} height={logoHeight} />}
        </div>
        {actions && <div className="mobile-app-header-actions">{actions}</div>}
      </div>
      {(title || subtitle) && (
        <div className="mobile-app-header-copy">
          {title && <h1 className="mobile-app-header-title">{title}</h1>}
          {subtitle && <p className="mobile-app-header-subtitle">{subtitle}</p>}
        </div>
      )}
      {meta && <p className="mobile-app-header-meta">{meta}</p>}
    </header>
  );
}
