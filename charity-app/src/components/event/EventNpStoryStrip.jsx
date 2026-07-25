/**
 * Always-visible nonprofit story strip for guest event pages.
 * View-only discovery — Learn more opens the full NP story modal.
 */
export default function EventNpStoryStrip({
  name,
  initials,
  bg,
  mission,
  onLearnMore,
  compact = false,
}) {
  if (!name) return null;
  const blurb = (mission || '').trim();

  return (
    <div
      className="np-info-row"
      style={{
        marginBottom: compact ? 12 : 16,
        alignItems: blurb ? 'flex-start' : 'center',
        padding: compact ? '10px 0' : '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: bg || 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'white',
          flexShrink: 0,
          marginTop: blurb ? 2 : 0,
        }}
      >
        {initials || 'NP'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified nonprofit</p>
        {blurb ? (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              marginTop: 6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {blurb}
          </p>
        ) : null}
      </div>
      {typeof onLearnMore === 'function' && (
        <button type="button" className="btn-ghost" style={{ fontSize: 13, flexShrink: 0 }} onClick={onLearnMore}>
          Learn more
        </button>
      )}
    </div>
  );
}
