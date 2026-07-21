import { useCallback, useState } from 'react';

/**
 * Pick cover vs contain for a fixed-size container.
 * Uses contain when letterboxing would be ≤12% on either axis; otherwise cover.
 */
export function pickObjectFit(naturalWidth, naturalHeight, containerWidth, containerHeight) {
  if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
    return 'cover';
  }
  const containScale = Math.min(
    containerWidth / naturalWidth,
    containerHeight / naturalHeight,
  );
  const fitW = naturalWidth * containScale;
  const fitH = naturalHeight * containScale;
  const emptyFrac = Math.max(
    (containerWidth - fitW) / containerWidth,
    (containerHeight - fitH) / containerHeight,
  );
  return emptyFrac <= 0.12 ? 'contain' : 'cover';
}

/**
 * Shared event image — fills a fixed parent when `fill` is true.
 * Container dimensions are controlled by CSS; this only scales the image inside.
 */
export function EventImage({
  src,
  alt = '',
  className = '',
  variant = 'responsive',
  fill = false,
  fit = 'smart',
  style,
  ...props
}) {
  const [objectFit, setObjectFit] = useState('cover');

  const handleLoad = useCallback((e) => {
    if (!fill || fit === 'cover') return;
    const img = e.currentTarget;
    const container = img.parentElement;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    setObjectFit(pickObjectFit(img.naturalWidth, img.naturalHeight, width, height));
  }, [fill, fit]);

  if (!src) return null;

  const variantClass = variant === 'responsive' ? '' : ` event-img--${variant}`;
  const fillClass = fill ? ' event-img--fill' : '';

  return (
    <img
      src={src}
      alt={alt}
      className={`event-img${variantClass}${fillClass}${className ? ` ${className}` : ''}`}
      style={fill ? { objectFit: fit === 'cover' ? 'cover' : objectFit, ...style } : style}
      loading="lazy"
      decoding="async"
      onLoad={fill ? handleLoad : undefined}
      {...props}
    />
  );
}

/**
 * Fixed-size image container + overlay slot(s).
 * variant: card | hero | reel | grid | compact | preview | profile-cover | profile-tile | np-tile | community
 */
export function EventImageBanner({
  src,
  alt = '',
  variant = 'card',
  className = '',
  style,
  objectPosition,
  children,
}) {
  if (!src) return null;

  const fillCover = variant === 'np-tile' || variant === 'compact' || variant === 'hero';

  return (
    <div
      className={`event-img-banner event-img-banner--${variant}${className ? ` ${className}` : ''}`}
      style={style}
    >
      <EventImage
        src={src}
        alt={alt}
        fill
        fit={fillCover ? 'cover' : 'smart'}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {children}
    </div>
  );
}
