const DEFAULT_THUMB = '/events/give-now/img1.jpg';

/** Map GET /np/approvals queue item → mobile card props. */
export function mapMobileApprovalRow(raw) {
  const status = raw.status ?? '';
  const isChanges = status.toLowerCase().includes('changes');
  return {
    id: raw.id,
    key: raw.key,
    title: raw.title ?? 'Untitled event',
    organizer: raw.organizer ?? 'Unknown',
    date: raw.date,
    location: raw.location,
    desc: raw.story,
    submitted: null,
    status: isChanges ? 'changes' : 'new',
    hasHero: !!raw.key,
    hasAvatar: !!raw.organizer,
    heroImg: raw.key ? `/events/${raw.key}/img1.jpg` : DEFAULT_THUMB,
    apiStatus: status,
  };
}

/** Map GET /np/approvals queue item → desktop card props. */
export function mapDesktopApprovalRow(raw) {
  const status = raw.status ?? '';
  const lower = status.toLowerCase();
  let uiStatus = 'New request';
  if (lower.includes('changes')) uiStatus = 'Changes requested';
  else if (lower === 'live' || lower === 'approved') uiStatus = 'Approved';
  else if (lower === 'rejected') uiStatus = 'Rejected';

  const organizer =
    typeof raw.organizer === 'string'
      ? raw.organizer
      : (raw.organizer?.name ?? 'Unknown');

  return {
    id: raw.id,
    key: raw.key,
    title: raw.title ?? 'Untitled event',
    organizer: organizer || 'Unknown',
    date: raw.date ?? '—',
    location: raw.location ?? '—',
    desc: raw.story ?? '',
    submitted: raw.date ? `Submitted ${raw.date}` : null,
    status: uiStatus,
    heroImg: raw.key ? `/events/${raw.key}/img1.jpg` : DEFAULT_THUMB,
    apiStatus: status,
  };
}

export function npReviewPath(eventId) {
  return `/np/approvals/review?id=${eventId}`;
}

export function npRequestChangesPath(eventId) {
  return `/np/approvals/request-changes?id=${eventId}`;
}
