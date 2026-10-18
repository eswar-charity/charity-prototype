export const NO_PHOTO_GRADIENT = 'linear-gradient(135deg,#0A2E52,#1A6EB5)';

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
    hasHero: true,
    hasAvatar: !!raw.organizer,
    heroImg: raw.cover || null, // null -> the screen draws a branded gradient
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
    submitted: raw.created_at
      ? `Submitted ${new Date(raw.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : null,
    status: uiStatus,
    heroImg: raw.cover || null,
    apiStatus: status,
  };
}

export function npReviewPath(eventId) {
  return `/np/approvals/review?id=${eventId}`;
}

export function npRequestChangesPath(eventId) {
  return `/np/approvals/request-changes?id=${eventId}`;
}
