const REVIEW_STATUSES = new Set([
  'Submitted',
  'Pending',
  'In Review',
  'Changes Requested',
  'Rejected',
  'Draft',
]);

/** Map API event.status (+ is_live) → approval UI state. */
export function mapEventStatusToUi(apiStatus, isLive) {
  const status = apiStatus || '';
  if (status === 'Completed' || status === 'Archived') return 'completed';
  if (status === 'Live' || isLive) return 'live';
  if (status === 'Approved') return 'approved';
  if (REVIEW_STATUSES.has(status)) return 'review';
  return 'review';
}
