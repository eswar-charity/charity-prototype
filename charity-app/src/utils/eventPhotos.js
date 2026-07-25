/**
 * Resolve cover / gallery URLs for events from API + local catalog assets.
 */
import { EVENT_CATALOG } from '../data/eventData.js';
import { EVENT_PHOTO_MANIFEST } from '../data/eventPhotoManifest.js';

export const DEFAULT_EVENT_COVER = '/events/neon-night/img1.jpg';

function catalogPhotosForKey(key) {
  if (!key) return [];
  const entry = EVENT_CATALOG.find((e) => e.key === key || e.assetKey === key);
  if (!entry) return [];
  const assetKey = entry.assetKey || entry.key;
  const meta = EVENT_PHOTO_MANIFEST[assetKey] || { photoCount: 1, photoExt: {} };
  const { photoCount, photoExt = {} } = meta;
  return Array.from({ length: photoCount }, (_, i) => {
    const n = i + 1;
    const ext = photoExt[n] || photoExt[String(n)] || 'jpg';
    return `/events/${assetKey}/img${n}.${ext}`;
  });
}

function isUsableUrl(u) {
  return typeof u === 'string' && u.trim().length > 0 && !u.startsWith('blob:');
}

/** Full photo list for an event (API → catalog). Empty when none uploaded. */
export function resolveEventPhotos(ev) {
  const fromApi = (ev?.photos || []).filter(isUsableUrl);
  if (fromApi.length) return fromApi;
  return catalogPhotosForKey(ev?.key);
}

/** Cover image URL — never empty for a known/displayable event. */
export function resolveEventCover(ev) {
  if (!ev) return DEFAULT_EVENT_COVER;
  if (isUsableUrl(ev.cover)) return ev.cover;
  const photos = resolveEventPhotos(ev);
  return photos[0] || DEFAULT_EVENT_COVER;
}
