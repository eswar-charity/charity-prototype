# Frontend API Integration — Slice B5 Admin Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `adminData.js` primary datasets with live `/admin/*` endpoints across dashboard, review, nonprofits, events, exceptions, and audit — preserve Admin UI.

**Architecture:** New `api/admin.js` wrapping all admin routes. Keep `statusTone` (and similar pure UI helpers) in `adminData.js` or move to `utils/adminUi.js`. Auth: platform_admin (`alex.mercer@charityhub.com` / `Passw0rd!`). Branch: **`thread-test` only**.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` §B5.

## Global Constraints

- Preserve UI/UX; no redesign.
- No new backend endpoints / no new branches.
- Commit per task on `thread-test`.
- `adminData.js` may retain pure helpers only after datasets removed from screens.

## File structure

| Path | Responsibility |
|------|----------------|
| `api/admin.js` | All `/admin/*` client calls |
| Admin screens under `screens/admin/` | live lists + mutations |
| `AdminLayout.jsx` | live stats/user from dashboard + `/auth/me` |

---

### Task 1: api/admin.js

```js
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
```

Confirm response shapes in `admin_service` before adapting list rows.

- [ ] **Commit** `feat(app): add admin API module for /admin endpoints`

---

### Task 2: AdminLayout + Dashboard

Wire `AdminLayout` stats from `getAdminDashboard`; user name from `useAuth().user`. Wire `AdminDashboard.jsx` counters + recent review/exceptions previews.

- [ ] **Commit** `feat(app): wire admin layout and dashboard to live API`

---

### Task 3: Review queue + detail

`AdminReviewQueue`, `AdminReviewDetail` — listAdminReviews, getAdminReview, adminReviewAction. Toast + refresh.

- [ ] **Commit** `feat(app): wire admin review queue to live API`

---

### Task 4: Nonprofits list + detail + invite

`AdminNonprofits`, `AdminNonprofitDetail` — list/get/action/invite.

- [ ] **Commit** `feat(app): wire admin nonprofits to live API`

---

### Task 5: Events + Exceptions + Audit

`AdminEvents`, `AdminExceptions`, `AdminAuditLog`.

- [ ] **Commit** `feat(app): wire admin events, exceptions, and audit to live API`

---

### Task 6: B5 + Sub-project B exit

Grep `adminData` dataset imports from screens; keep only `statusTone` helpers. Write `b5-exit-report.md` and note Sub-project B complete when clean.

---

## Self-review vs §B5

All `/admin/*` screen groups covered in Tasks 2–5.
