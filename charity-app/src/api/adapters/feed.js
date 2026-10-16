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

function adaptReply(reply) {
  const author = reply.author || {};
  const media = reply.media_url || null;
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

/**
 * Map API community posts to the thread UI shape. Everything shown — text,
 * photos, authors, replies — comes from the database; nothing is invented here.
 */
export function adaptCommunityPosts(items) {
  return (items || []).map((p) => {
    const author = p.author || {};
    const media = p.media_url || null;
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
      replies: (p.replies || []).map(adaptReply),
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
    media: m.media_url || null,
    mediaType: m.media_resource_type || null,
    reaction: m.reaction,
    mine,
    sent: mine ? 'Sent' : undefined,
  };
}
