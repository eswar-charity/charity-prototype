import Logo from './Logo';

function LogoButton({ height = 22 }) {
  return <Logo height={height} />;
}

/**
 * Mobile app chrome with Charity Hub logo.
 * layout: feed (logo left) | bar (logo center) | center (logo between left/actions)
 */
export default function MobileAppHeader({
  layout = 'feed',
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
            <LogoButton height={logoHeight} />
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
          {left ?? <LogoButton height={logoHeight} />}
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
