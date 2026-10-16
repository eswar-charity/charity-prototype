/**
 * Resolve cover / gallery URLs for events. Photos come from the API (Cloudinary
 * media rows attached to the event); there is no client-side catalog fallback.
 */

// Neutral placeholder for events that have no photo yet.
export const DEFAULT_EVENT_COVER = '/charity-hub-logo.png';

function isUsableUrl(u) {
  return typeof u === 'string' && u.trim().length > 0 && !u.startsWith('blob:');
}

/** Full photo list for an event. Empty when none have been uploaded. */
export function resolveEventPhotos(ev) {
  return (ev?.photos || []).filter(isUsableUrl);
}

/** Cover image URL — falls back to a neutral placeholder, never a stock photo. */
export function resolveEventCover(ev) {
  if (!ev) return DEFAULT_EVENT_COVER;
  if (isUsableUrl(ev.cover)) return ev.cover;
  const photos = resolveEventPhotos(ev);
  return photos[0] || DEFAULT_EVENT_COVER;
}
