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
    id: e.id,
    code: e.code,
    type: e.type,
    title: e.title,
    entity: e.entity,
    severity: e.severity,
    status: e.status,
    amount: e.amount,
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
