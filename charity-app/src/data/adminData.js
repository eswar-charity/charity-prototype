/* ────────────────────────────────────────────────────────────
   CHARITY HUB — PLATFORM ADMIN (internal operating role)
   Mock data for the Admin Portal (Blueprint journey #9).
   Grounded in the Master Blueprint:
   - §8 Entity Lifecycle Models (Nonprofit, Event, Payout, Content,
     Admin Review Item)
   - §9 Role-Based Permissions (Charity Hub Admin)
   - §10 Journey-to-Screen Traceability (Admin Portal: review
     queues, nonprofits, events, exceptions, audit log)
   Static prototype data only — no backend.
──────────────────────────────────────────────────────────── */

// Top-line operational counters for the dashboard.
export const adminStats = {
  reviewQueue: 7,
  pendingVerification: 3,
  liveEvents: 5,
  openExceptions: 4,
  gmvWeek: 48250,
  payoutsPending: 6,
};

/* Admin Review Item lifecycle (§8):
   New -> In Review -> Approved / Rejected / Escalated -> Closed */
export const REVIEW_STATUSES = ['New', 'In Review', 'Escalated', 'Approved', 'Rejected', 'Closed'];

export const reviewQueue = [
  {
    id: 'RV-2041',
    type: 'Nonprofit Verification',
    title: 'Clean Air Alliance — EIN verification',
    entity: 'Clean Air Alliance',
    entityInitials: 'CA',
    submittedBy: 'Dana Whitfield',
    submittedRole: 'Nonprofit Admin',
    submittedAt: '2 hours ago',
    status: 'New',
    priority: 'High',
    summary: 'New 501(c)(3) submitted for verification. EIN 47-2029183 awaiting IRS / GuideStar resolution before settlement can be enabled.',
    checks: [
      { label: 'EIN format valid', ok: true },
      { label: 'IRS Business Master File match', ok: true },
      { label: 'GuideStar / Candid record', ok: true },
      { label: 'Settlement account connected', ok: false },
    ],
  },
  {
    id: 'RV-2040',
    type: 'SE Event',
    title: "Coastal Cleanup Wave 2 — SE event approval",
    entity: 'Ocean Conservancy',
    entityInitials: 'OC',
    submittedBy: 'Mike Rivera',
    submittedRole: 'Social Entrepreneur',
    submittedAt: '5 hours ago',
    status: 'In Review',
    priority: 'Medium',
    summary: 'SE-created event linked to Ocean Conservancy. Nonprofit approval recorded; flagged for platform brand-safety spot check before auto-publish.',
    checks: [
      { label: 'Linked nonprofit verified', ok: true },
      { label: 'Nonprofit approval on record', ok: true },
      { label: 'Content brand-safety scan', ok: true },
      { label: 'Prohibited-claims check', ok: false },
    ],
  },
  {
    id: 'RV-2039',
    type: 'Content Flag',
    title: "Flagged comment — 'Books for Bright Minds Gala'",
    entity: 'Books for Communities',
    entityInitials: 'BC',
    submittedBy: 'Automated moderation',
    submittedRole: 'System',
    submittedAt: '6 hours ago',
    status: 'Escalated',
    priority: 'High',
    summary: 'Automated moderation filter flagged a comment for review. Nonprofit Admin escalated to the platform after a user dispute.',
    checks: [
      { label: 'Automated filter match', ok: true },
      { label: 'Nonprofit moderation attempted', ok: true },
      { label: 'User dispute opened', ok: true },
    ],
  },
  {
    id: 'RV-2038',
    type: 'Nonprofit Verification',
    title: 'Harborview Youth Trust — EIN verification',
    entity: 'Harborview Youth Trust',
    entityInitials: 'HY',
    submittedBy: 'Leon Park',
    submittedRole: 'Nonprofit Admin',
    submittedAt: '1 day ago',
    status: 'In Review',
    priority: 'Medium',
    summary: 'EIN did not resolve on first pass against IRS BMF. No manual fallback is permitted under current policy — awaiting resubmission.',
    checks: [
      { label: 'EIN format valid', ok: true },
      { label: 'IRS Business Master File match', ok: false },
      { label: 'GuideStar / Candid record', ok: false },
    ],
  },
  {
    id: 'RV-2037',
    type: 'Payout Exception',
    title: 'Payout hold — Food Bank NYC',
    entity: 'Food Bank NYC',
    entityInitials: 'FB',
    submittedBy: 'Payment layer',
    submittedRole: 'System',
    submittedAt: '1 day ago',
    status: 'New',
    priority: 'High',
    summary: 'Reconciliation mismatch between donations captured and payout batch. Held pending evidence review.',
    checks: [
      { label: 'Settlement account verified', ok: true },
      { label: 'Donation ledger reconciled', ok: false },
      { label: 'Payout evidence attached', ok: false },
    ],
  },
  {
    id: 'RV-2036',
    type: 'SE Event',
    title: "Urban Oasis Seed Drive — SE event approval",
    entity: 'Clean Air Alliance',
    entityInitials: 'CA',
    submittedBy: 'Mike Rivera',
    submittedRole: 'Social Entrepreneur',
    submittedAt: '2 days ago',
    status: 'Approved',
    priority: 'Low',
    summary: 'SE event approved by nonprofit and auto-published after platform review. No further action required.',
    checks: [
      { label: 'Linked nonprofit verified', ok: true },
      { label: 'Nonprofit approval on record', ok: true },
      { label: 'Content brand-safety scan', ok: true },
    ],
  },
  {
    id: 'RV-2035',
    type: 'Minor SE Consent',
    title: 'Minor SE consent review — A. Ramirez',
    entity: 'Youth Health Fund',
    entityInitials: 'YH',
    submittedBy: 'Guardian: C. Ramirez',
    submittedRole: 'Parent / Guardian',
    submittedAt: '2 days ago',
    status: 'New',
    priority: 'High',
    summary: 'Parent/guardian consent submitted for a Minor Social Entrepreneur. Action-level controls must be confirmed before any meaningful platform action is unblocked.',
    checks: [
      { label: 'Age eligibility confirmed', ok: true },
      { label: 'Guardian identity captured', ok: true },
      { label: 'Consent scope acknowledged', ok: false },
    ],
  },
];

/* Nonprofit lifecycle (§8):
   Draft -> Submitted -> Pending Verification -> Verified -> Active
        -> Rejected -> Suspended */
export const NONPROFIT_STATUSES = ['Draft', 'Submitted', 'Pending Verification', 'Verified', 'Active', 'Rejected', 'Suspended'];

export const adminNonprofits = [
  { id: 1, name: 'Ocean Conservancy', initials: 'OC', ein: '23-7245152', category: 'Environment', status: 'Active', settlement: 'Ready', events: 6, raised: 128400, source: 'IRS BMF', submittedAt: 'Mar 2, 2025' },
  { id: 2, name: 'Food Bank NYC', initials: 'FB', ein: '13-3179858', category: 'Food & Hunger', status: 'Active', settlement: 'Payout hold', events: 4, raised: 96300, source: 'GuideStar', submittedAt: 'Jan 18, 2025' },
  { id: 3, name: 'Books for Communities', initials: 'BC', ein: '81-4419920', category: 'Education', status: 'Verified', settlement: 'Ready', events: 3, raised: 54200, source: 'IRS BMF', submittedAt: 'Apr 11, 2025' },
  { id: 4, name: 'Clean Air Alliance', initials: 'CA', ein: '47-2029183', category: 'Environment', status: 'Pending Verification', settlement: 'Not ready', events: 0, raised: 0, source: '—', submittedAt: '2 hours ago' },
  { id: 5, name: 'Youth Health Fund', initials: 'YH', ein: '52-1693387', category: 'Health', status: 'Active', settlement: 'Ready', events: 5, raised: 74100, source: 'Charity Navigator', submittedAt: 'Feb 6, 2025' },
  { id: 6, name: 'Harborview Youth Trust', initials: 'HY', ein: '—', category: 'Community', status: 'Rejected', settlement: 'Not ready', events: 0, raised: 0, source: 'No match', submittedAt: '1 day ago' },
  { id: 7, name: 'Prairie Arts Collective', initials: 'PA', ein: '84-3320117', category: 'Arts', status: 'Submitted', settlement: 'Not ready', events: 0, raised: 0, source: '—', submittedAt: '3 days ago' },
  { id: 8, name: 'Shelter Together', initials: 'ST', ein: '30-0918822', category: 'Housing', status: 'Suspended', settlement: 'Frozen', events: 2, raised: 18900, source: 'IRS BMF', submittedAt: 'Dec 1, 2024' },
];

/* Event lifecycle (§8):
   Draft -> Submitted -> Changes Requested -> Approved
        -> Live -> Completed -> Archived / Cancelled / Rejected */
export const adminEvents = [
  { id: 1, title: 'Neon Night Run', nonprofit: 'Youth Health Fund', organizer: 'Mike Rivera', kind: 'SE-led', status: 'Live', joined: 87, raised: 14280, flags: 0 },
  { id: 2, title: 'Breakneck Ridge Run', nonprofit: 'Ocean Conservancy', organizer: 'Mike Rivera', kind: 'SE-led', status: 'Live', joined: 62, raised: 8920, flags: 0 },
  { id: 3, title: 'Give Now, Apré Later', nonprofit: 'Books for Communities', organizer: 'Mike Rivera', kind: 'SE-led', status: 'Live', joined: 44, raised: 5400, flags: 0 },
  { id: 4, title: 'Dog Dad 5K', nonprofit: 'Youth Health Fund', organizer: 'Mike Rivera', kind: 'SE-led', status: 'Live', joined: 28, raised: 3200, flags: 0 },
  { id: 5, title: 'Charity Hub Golf Outing', nonprofit: 'Food Bank NYC', organizer: 'Mike Rivera', kind: 'SE-led', status: 'Live', joined: 36, raised: 6800, flags: 0 },
  { id: 6, title: 'Books for Bright Minds Gala', nonprofit: 'Books for Communities', organizer: 'Books for Communities', kind: 'Nonprofit-led', status: 'Live', joined: 42, raised: 8920, flags: 1 },
  { id: 7, title: 'Winter Warmth Drive', nonprofit: 'Food Bank NYC', organizer: 'Food Bank NYC', kind: 'Nonprofit-led', status: 'Changes Requested', joined: 0, raised: 0, flags: 0 },
];

/* Exceptions — payout, donation, dispute, and content edge cases
   surfaced to the platform (§5 Payout/Reconciliation, §13 risks). */
export const EXCEPTION_STATUSES = ['Open', 'In Review', 'Escalated', 'Resolved'];

export const exceptions = [
  { id: 'EX-118', type: 'Payout', title: 'Reconciliation mismatch on weekly payout batch', entity: 'Food Bank NYC', severity: 'High', status: 'Open', amount: 9600, opened: '1 day ago' },
  { id: 'EX-117', type: 'Donation', title: 'Chargeback filed on $250 donation', entity: 'Ocean Conservancy', severity: 'Medium', status: 'In Review', amount: 250, opened: '2 days ago' },
  { id: 'EX-116', type: 'Content', title: 'Repeated flags on event comment thread', entity: 'Books for Communities', severity: 'Medium', status: 'Escalated', amount: 0, opened: '2 days ago' },
  { id: 'EX-115', type: 'Dispute', title: 'Refund request past 30-day window', entity: 'Youth Health Fund', severity: 'Low', status: 'Resolved', amount: 120, opened: '5 days ago' },
];

/* Immutable audit trail of platform actions (§10 Admin Portal). */
export const auditLog = [
  { id: 1, actor: 'Alex Mercer', role: 'Platform Admin', action: 'Approved event', target: 'Urban Oasis Seed Drive (RV-2036)', category: 'Approval', at: 'Today, 09:42' },
  { id: 2, actor: 'System', role: 'Payment layer', action: 'Flagged payout exception', target: 'Food Bank NYC (EX-118)', category: 'Exception', at: 'Today, 08:15' },
  { id: 3, actor: 'Priya Shah', role: 'Platform Admin', action: 'Verified nonprofit', target: 'Books for Communities', category: 'Verification', at: 'Yesterday, 17:03' },
  { id: 4, actor: 'Alex Mercer', role: 'Platform Admin', action: 'Suspended nonprofit', target: 'Shelter Together', category: 'Governance', at: 'Yesterday, 14:20' },
  { id: 5, actor: 'System', role: 'Moderation', action: 'Escalated content flag', target: 'Books for Bright Minds Gala (RV-2039)', category: 'Moderation', at: 'Yesterday, 11:47' },
  { id: 6, actor: 'Priya Shah', role: 'Platform Admin', action: 'Rejected verification', target: 'Harborview Youth Trust', category: 'Verification', at: 'Jul 7, 16:10' },
  { id: 7, actor: 'Alex Mercer', role: 'Platform Admin', action: 'Requested changes', target: 'Winter Warmth Drive', category: 'Approval', at: 'Jul 7, 10:29' },
];

export const adminUser = { name: 'Alex Mercer', role: 'Platform Admin', initials: 'AM' };

// Shared status → visual tone map used across admin screens.
export function statusTone(status) {
  const s = String(status).toLowerCase();
  if (['active', 'verified', 'approved', 'resolved', 'live', 'ready'].includes(s)) return 'ok';
  if (['new', 'submitted', 'in review', 'pending verification', 'open', 'changes requested'].includes(s)) return 'info';
  if (['escalated', 'high'].includes(s)) return 'warn';
  if (['rejected', 'suspended', 'cancelled', 'frozen', 'payout hold', 'not ready'].includes(s)) return 'danger';
  return 'muted';
}
