import { apiRequest } from './client.js';

export function getAdminDashboard() {
  return apiRequest('/admin/dashboard');
}

export function listAdminReviews({ status } = {}) {
  const q = new URLSearchParams();
  if (status) q.set('status', status);
  const s = q.toString();
  return apiRequest(`/admin/review${s ? `?${s}` : ''}`);
}

export function getAdminReview(reviewId) {
  return apiRequest(`/admin/review/${reviewId}`);
}

export function adminReviewAction(reviewId, action) {
  return apiRequest(`/admin/review/${reviewId}/${action}`, { method: 'POST' });
}

export function listAdminNonprofits({ status, page = 1, limit = 50 } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set('status', status);
  return apiRequest(`/admin/nonprofits?${q}`);
}

export function inviteNonprofit(body) {
  return apiRequest('/admin/nonprofits/invite', { method: 'POST', body });
}

/** Issue a single-use account invite for a nonprofit's admin. Returns { invite_url, ... }. */
export function inviteNonprofitAdmin(nonprofitId, email) {
  return apiRequest(`/admin/nonprofits/${nonprofitId}/invite-admin`, { method: 'POST', body: { email } });
}

export function getAdminNonprofit(id) {
  return apiRequest(`/admin/nonprofits/${id}`);
}

export function adminNonprofitAction(id, action) {
  return apiRequest(`/admin/nonprofits/${id}/${action}`, { method: 'POST' });
}

export function listAdminEvents() {
  return apiRequest('/admin/events');
}

export function listAdminExceptions({ status } = {}) {
  const q = new URLSearchParams();
  if (status) q.set('status', status);
  const s = q.toString();
  return apiRequest(`/admin/exceptions${s ? `?${s}` : ''}`);
}

export function adminExceptionAction(excId, action) {
  return apiRequest(`/admin/exceptions/${excId}/${action}`, { method: 'POST' });
}

export function listAdminAudit({ category } = {}) {
  const q = new URLSearchParams();
  if (category) q.set('category', category);
  const s = q.toString();
  return apiRequest(`/admin/audit${s ? `?${s}` : ''}`);
}

/** Map admin_service review row → UI-friendly shape (snake_case → camelCase, code for display). */
export function adaptReviewItem(r) {
  if (!r) return null;
  return {
    id: r.id,
    code: r.code,
    type: r.type,
    title: r.title,
    entity: r.entity,
    submittedBy: r.submitted_by,
    submittedRole: r.submitted_role,
    status: r.status,
    priority: r.priority,
    summary: r.summary,
    checks: r.checks ?? [],
  };
}

/** Map admin_service exception row → UI-friendly shape. */
export function adaptExceptionItem(e) {
  if (!e) return null;
  return {
    id: e.code ?? String(e.id),
    rawId: e.id,
    code: e.code,
    type: e.type,
    title: e.title,
    entity: e.entity,
    severity: e.severity,
    status: e.status,
    amount: e.amount ?? 0,
  };
}

function initialsFromName(name) {
  const parts = String(name ?? '').split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '—';
}

function formatAuditAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffMs < 86400000) return `Today, ${time}`;
    if (diffMs < 172800000) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return String(iso);
  }
}

/** Map admin_service nonprofit row → UI-friendly shape. */
export function adaptAdminNonprofit(n) {
  if (!n) return null;
  return {
    id: n.id,
    name: n.name,
    slug: n.slug,
    initials: n.initials ?? initialsFromName(n.name),
    ein: n.ein ?? '—',
    category: n.category,
    status: n.status,
    settlement: n.settlement_status ?? 'Not ready',
    verified: n.verified,
    source: n.source ?? '—',
    events: n.events ?? 0,
    raised: n.raised ?? 0,
    submittedAt: n.submitted_at ?? n.created_at ?? '—',
  };
}

/** Map admin_service event row → UI-friendly shape. */
export function adaptAdminEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    key: e.key,
    title: e.title,
    nonprofit: e.nonprofit ?? e.nonprofit_name ?? '—',
    organizer: e.organizer ?? e.organizer_name ?? '—',
    kind: e.kind ?? 'SE-led',
    status: e.status,
    joined: e.joined ?? 0,
    raised: e.raised ?? 0,
    flags: e.flags ?? 0,
    nonprofitId: e.nonprofit_id ?? null,
  };
}

/** Map admin_service audit row → UI-friendly shape. */
export function adaptAuditEntry(a) {
  if (!a) return null;
  return {
    id: a.id,
    actor: a.actor,
    role: a.role ?? '—',
    action: a.action,
    target: a.target ?? '—',
    category: a.category ?? 'Governance',
    at: formatAuditAt(a.at),
  };
}

/** Map admin_service dashboard payload → UI stats + preview lists. */
export function adaptAdminDashboard(d) {
  if (!d) return null;
  return {
    reviewQueue: d.review_queue ?? 0,
    pendingVerification: d.pending_verification ?? 0,
    liveEvents: d.live_events ?? 0,
    openExceptions: d.open_exceptions ?? 0,
    gmvWeek: d.gmv_week ?? 0,
    payoutsPending: d.payouts_pending ?? 0,
    actionRequired: (d.action_required ?? []).map(adaptReviewItem),
    openExceptionItems: (d.open_exception_items ?? []).map(adaptExceptionItem),
  };
}
