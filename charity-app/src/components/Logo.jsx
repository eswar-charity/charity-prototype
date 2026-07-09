/**
 * Charity Hub brand logo — a scalable recreation of the wordmark:
 * "Charity" beside "Hub" set in a blue oval badge, with a small ® mark.
 *
 * Props:
 *   height — pixel height of the mark (the oval); text scales from it.
 *   tone   — 'dark' for light backgrounds (Charity in Deep Blue),
 *            'light' for dark backgrounds (Charity in white).
 *
 * To use an exact raster instead, drop the file at
 * `charity-app/public/charity-hub-logo.png` and swap the body of this
 * component for: <img src="/charity-hub-logo.png" alt="Charity Hub" style={{ height }} />
 */
export default function Logo({ height = 26, tone = 'dark', className = '', ...rest }) {
  const wordColor = tone === 'light' ? '#FFFFFF' : '#0D4A8A';
  const regColor = tone === 'light' ? '#A8D8F0' : '#1A6EB5';
  return (
    <span
      className={`ch-logo ${className}`}
      style={{ '--ch-h': `${height}px` }}
      aria-label="Charity Hub"
      role="img"
      {...rest}
    >
      <span className="ch-logo-word" style={{ color: wordColor }}>Charity</span>
      <span className="ch-logo-hub">
        <span className="ch-logo-hub-text">Hub</span>
      </span>
      <span className="ch-logo-reg" style={{ color: regColor }}>®</span>
    </span>
  );
}
