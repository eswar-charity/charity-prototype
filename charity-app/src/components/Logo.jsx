/**
 * Charity Hub brand logo — official wordmark image.
 *
 * Props:
 *   height — pixel height of the logo image.
 *   tone   — kept for API compatibility; image is always the full-color mark.
 */
export default function Logo({ height = 26, tone = 'dark', className = '', style, ...rest }) {
  return (
    <img
      src="/charity-hub-logo.png"
      alt="Charity Hub"
      className={`ch-logo-img ${className}`}
      style={{ height, width: 'auto', display: 'block', ...style }}
      {...rest}
    />
  );
}
