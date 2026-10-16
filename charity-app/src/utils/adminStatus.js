// Shared status → visual tone map used across admin screens (presentation only).
export function statusTone(status) {
  const s = String(status).toLowerCase();
  if (['active', 'verified', 'approved', 'resolved', 'live', 'ready', 'successful', 'completed'].includes(s)) return 'ok';
  if (['new', 'submitted', 'in review', 'pending verification', 'open', 'changes requested'].includes(s)) return 'info';
  if (['escalated', 'high'].includes(s)) return 'warn';
  if (['rejected', 'suspended', 'cancelled', 'frozen', 'payout hold', 'not ready', 'failed', 'disputed'].includes(s)) return 'danger';
  return 'muted';
}
