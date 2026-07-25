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

const PHOTO_CAPTIONS = [
  'Setting up — the energy is already here.',
  'Captured this moment from the floor.',
  'Crowds gathering for a great cause.',
  'Another snapshot from today.',
  'Sharing the vibe with everyone following along.',
];

const TEXT_BLURBS = [
  { name: 'Marcus L.', initials: 'ML', color: '#0D7377', text: 'So glad this is happening — count me in!' },
  { name: 'Emma J.', initials: 'EJ', color: '#1976D2', text: 'First Charity Hub event for me. Loving the community.' },
  { name: 'Sam K.', initials: 'SK', color: '#7B1FA2', text: 'Who else is tuning in from out of town?' },
  { name: 'Jordan P.', initials: 'JP', color: '#F57C00', text: 'The mission behind this event is why I showed up.' },
];

function hostMeta(ev) {
  return {
    name: ev?.organizer || 'Host',
    initials: ev?.initials || 'H',
  };
}

function makeThreadPost({
  id, phase, name, initials, color, time = '', host = false, verified = false,
  highlight = null, text = null, media = null, mediaAlt = null, replies = [],
}) {
  return {
    id,
    phase,
    name,
    initials,
    avatarBg: color
      ? `linear-gradient(135deg, ${color}, ${color}99)`
      : 'linear-gradient(135deg,var(--primary),var(--blue))',
    time,
    host,
    verified,
    highlight,
    text,
    media,
    mediaAlt,
    mediaSize: 'attachment',
    replies,
  };
}

/** Mix captioned photos with text-only posts so Community is not image-only. */
export function synthesizeGalleryThread(galleryUrls, ev) {
  const key = ev?.key || 'ev';
  const host = hostMeta(ev);
  const posts = [];
  let n = 0;

  posts.push(makeThreadPost({
    id: `gallery-${key}-text-open`,
    phase: 'before',
    name: host.name,
    initials: host.initials,
    host: true,
    verified: true,
    highlight: 'Announcement',
    text: `Welcome to ${ev?.title || 'this event'} — follow along for updates, photos, and moments from the community.`,
  }));

  galleryUrls.forEach((url, i) => {
    posts.push(makeThreadPost({
      id: `gallery-${key}-${i}`,
      phase: i === 0 ? 'before' : 'during',
      name: host.name,
      initials: host.initials,
      host: true,
      verified: true,
      text: PHOTO_CAPTIONS[i % PHOTO_CAPTIONS.length],
      media: url,
      mediaAlt: `Event photo ${i + 1}`,
    }));
    n += 1;

    const blurb = TEXT_BLURBS[i % TEXT_BLURBS.length];
    posts.push(makeThreadPost({
      id: `gallery-${key}-text-${n}`,
      phase: 'during',
      name: blurb.name,
      initials: blurb.initials,
      color: blurb.color,
      text: blurb.text,
    }));
  });

  return posts;
}

export function adaptCommunityPosts(items, galleryUrls, ev) {
  const pool = galleryUrls.slice();
  if (!items?.length) {
    return synthesizeGalleryThread(pool, ev);
  }

  // Attach gallery images to every other post missing media_url so some stay text-only.
  let fillSlot = 0;
  const adapted = items.map((p) => {
    const author = p.author || {};
    let media = p.media_url || null;
    if (!media && pool.length) {
      if (fillSlot % 2 === 0) media = pool.shift();
      fillSlot += 1;
    } else if (media) {
      fillSlot += 1;
    }
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

  // Leftover gallery → captioned photo posts interleaved with text blurbs.
  if (pool.length) {
    const extra = synthesizeGalleryThread(pool, ev).filter((p) => p.id.includes('gallery-'));
    // Drop the opening announcement from the extra block to avoid duplicate welcomes.
    const withoutOpen = extra.filter((p) => !String(p.id).endsWith('-text-open'));
    return [...adapted, ...withoutOpen];
  }

  // If every adapted post has media and none are text-only, append a couple of text blurbs.
  const hasTextOnly = adapted.some((p) => p.text && !p.media);
  if (!hasTextOnly) {
    const key = ev?.key || 'ev';
    TEXT_BLURBS.slice(0, 2).forEach((blurb, i) => {
      adapted.push(makeThreadPost({
        id: `community-${key}-text-${i}`,
        phase: 'during',
        name: blurb.name,
        initials: blurb.initials,
        color: blurb.color,
        text: blurb.text,
      }));
    });
  }

  return adapted;
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
    media: m.media_url || null,
    mediaType: m.media_resource_type || null,
    reaction: m.reaction,
    mine,
    sent: mine ? 'Sent' : undefined,
  };
}
