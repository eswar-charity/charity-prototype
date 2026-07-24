import { EVENT_CATALOG, getCommunityPhotos } from '../../data/eventData.js';
import { EVENT_PHOTO_MANIFEST } from '../../data/eventPhotoManifest.js';

function catalogEventPhotos(key) {
  const entry = EVENT_CATALOG.find((e) => e.key === key);
  if (!entry) return [];
  const meta = EVENT_PHOTO_MANIFEST[entry.assetKey] || { photoCount: 1, photoExt: {} };
  const { photoCount, photoExt = {} } = meta;
  return Array.from({ length: photoCount }, (_, i) => {
    const n = i + 1;
    const ext = photoExt[n] || photoExt[String(n)] || 'jpg';
    return `/events/${entry.assetKey}/img${n}.${ext}`;
  });
}

export function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avatarBg(author) {
  return author?.color
    ? `linear-gradient(135deg, ${author.color}, ${author.color}99)`
    : 'linear-gradient(135deg,var(--primary),var(--blue))';
}

function adaptReply(reply, pool) {
  const author = reply.author || {};
  const media = reply.media_url || (pool.length ? pool.shift() : null);
  return {
    id: reply.id,
    name: author.name || 'Member',
    initials: author.initials || '?',
    avatarBg: avatarBg(author),
    time: formatRelative(reply.created_at),
    text: reply.text,
    media,
    mediaAlt: reply.media_alt || (media ? `Photo shared by ${author.name || 'member'}` : null),
    mediaSize: 'attachment',
  };
}

export function galleryUrlsForEvent(ev) {
  const fromApi = (ev?.photos || []).filter((u) => typeof u === 'string' && u.length > 0);
  if (fromApi.length) return fromApi.slice();
  const photos = ev?.photos?.length ? ev.photos : catalogEventPhotos(ev?.key);
  return getCommunityPhotos({ ...ev, photos, cover: photos[0] }).slice();
}

export function synthesizeGalleryThread(galleryUrls, ev) {
  return galleryUrls.map((url, i) => ({
    id: `gallery-${ev?.key || 'ev'}-${i}`,
    phase: i === 0 ? 'before' : 'during',
    name: ev?.organizer || 'Host',
    initials: ev?.initials || 'H',
    avatarBg: 'linear-gradient(135deg,var(--primary),var(--blue))',
    time: '',
    host: true,
    verified: true,
    text: i === 0 ? 'Moments from this event' : null,
    media: url,
    mediaAlt: `Event photo ${i + 1}`,
    mediaSize: 'attachment',
    replies: [],
  }));
}

export function adaptCommunityPosts(items, galleryUrls, ev) {
  const pool = galleryUrls.slice();
  if (!items?.length) {
    return synthesizeGalleryThread(pool, ev);
  }
  return items.map((p) => {
    const author = p.author || {};
    const media = p.media_url || (pool.length ? pool.shift() : null);
    return {
      id: p.id,
      phase: p.phase || 'during',
      name: author.name || 'Member',
      initials: author.initials || '?',
      avatarBg: avatarBg(author),
      time: formatRelative(p.created_at),
      host: !!p.host,
      verified: !!p.verified,
      highlight: p.highlight || null,
      text: p.text,
      media,
      mediaAlt: p.media_alt || (media ? `Photo shared by ${author.name || 'member'}` : null),
      mediaSize: 'attachment',
      replies: (p.replies || []).map((r) => adaptReply(r, pool)),
    };
  });
}

export function adaptChatMessage(m, currentUserId) {
  const author = m.author || {};
  const mine = currentUserId != null && author.id === currentUserId;
  return {
    id: m.id,
    name: author.name,
    initials: mine ? 'ME' : (author.initials || '?'),
    avatar: avatarBg(author),
    host: !!m.host,
    verified: !!m.verified,
    text: m.text,
    reaction: m.reaction,
    mine,
    sent: mine ? 'Sent' : undefined,
  };
}
