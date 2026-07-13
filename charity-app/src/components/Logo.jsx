import { Link, useLocation } from 'react-router-dom';
import { FEED_HOME } from '../constants/routes';

/**
 * Charity Hub brand logo — official wordmark image.
 * Clicks navigate to /feed everywhere except the login page (/).
 */
export default function Logo({
  height = 26,
  tone = 'dark',
  className = '',
  style,
  onClick,
  linkToFeed,
  ...rest
}) {
  const { pathname } = useLocation();

  const shouldLink = linkToFeed ?? (pathname !== '/' && onClick === undefined);

  const img = (
    <img
      src="/charity-hub-logo.png"
      alt="Charity Hub"
      className="ch-logo-img"
      style={{ height, width: 'auto', display: 'block' }}
      draggable={false}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`ch-logo-btn${className ? ` ${className}` : ''}`}
        onClick={onClick}
        aria-label="Charity Hub home"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          lineHeight: 0,
          display: 'block',
          ...style,
        }}
        {...rest}
      >
        {img}
      </button>
    );
  }

  if (!shouldLink) {
    return (
      <img
        src="/charity-hub-logo.png"
        alt="Charity Hub"
        className={`ch-logo-img ${className}`.trim()}
        style={{ height, width: 'auto', display: 'block', ...style }}
        draggable={false}
        {...rest}
      />
    );
  }

  return (
    <Link
      to={FEED_HOME}
      className={`ch-logo-btn${className ? ` ${className}` : ''}`}
      aria-label="Charity Hub home"
      style={{
        display: 'block',
        lineHeight: 0,
        textDecoration: 'none',
        ...style,
      }}
      {...rest}
    >
      {img}
    </Link>
  );
}
