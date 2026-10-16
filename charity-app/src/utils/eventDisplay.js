/** Presentation helpers for events. Pure functions over API-shaped events — no data lives here. */

export function slugify(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Display hashtag — titles from the API already carry the # prefix. */
export function eventDisplayTitle(title) {
  const t = String(title || '');
  return t.startsWith('#') ? t : `#${t.replace(/[\s,'']+/g, '')}`;
}

/** Banner / story / feed card image — always the main cover. */
export function getEventBanner(event) {
  return event?.cover || event?.photos?.[0] || null;
}

/**
 * Vertical focal point for the wide desktop hero banner. Stored per event in
 * the database (events.cover_focus) so each hero crop keeps its subject in view.
 */
export function getEventBannerFocus(event) {
  return event?.coverFocus || 'center 45%';
}

/** Unique community / gallery photos — all event images except the cover. */
export function getCommunityPhotos(event) {
  if (!event?.photos?.length) return [];
  const cover = getEventBanner(event);
  const seen = new Set();
  return event.photos.filter((src) => {
    if (!src || src === cover || seen.has(src)) return false;
    seen.add(src);
    return true;
  });
}
