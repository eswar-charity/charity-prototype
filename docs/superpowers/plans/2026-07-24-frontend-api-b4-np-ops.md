# Frontend API Integration — Slice B4 NP Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire NP launchpad, activity, financials, profile, approvals queue/actions, and autopilot/trusted SEs to live FastAPI — preserve UI.

**Architecture:** Extend `api/dashboards.js` with NP endpoints; add `api/approvals.js` + NP profile via existing `nonprofits.js` (`/np/profile`). Thin adapters map API briefs → existing list row props. Branch: **`thread-test` only**.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` §B4.

**Depends on:** B0–B3. Demo NP: `np@charityhub.com` / `Passw0rd!`.

## Global Constraints

- Preserve UI/UX; mobile + desktop twins.
- No new backend endpoints / no new branches.
- Stage task-scoped paths; commit per task.
- Out of scope: Admin portal (B5).

## File structure

| Path | Responsibility |
|------|----------------|
| `api/dashboards.js` | + getNpLaunchpad, getNpActivity, getNpFinancials |
| `api/approvals.js` | queue, detail, approve, reject, requestChanges, autopilot CRUD |
| `api/nonprofits.js` | + getNpProfile, updateNpProfile if missing |
| Launchpad / Activity / Financials / Profile screens | live data |
| Approvals / Review / RequestChanges | live queue + mutations |
| Autopilot screens | live settings + trusted SEs |

---

### Task 1: NP API modules

**Files:** Modify `dashboards.js`, `nonprofits.js`; Create `approvals.js`

```js
// dashboards.js additions
export function getNpLaunchpad() {
  return apiRequest('/np/launchpad');
}
export function getNpActivity() {
  return apiRequest('/np/activity');
}
export function getNpFinancials() {
  return apiRequest('/np/financials');
}

// approvals.js
export function listApprovals() {
  return apiRequest('/np/approvals');
}
export function getApproval(eventId) {
  return apiRequest(`/np/approvals/${eventId}`);
}
export function approveEvent(eventId) {
  return apiRequest(`/np/approvals/${eventId}/approve`, { method: 'POST' });
}
export function rejectEvent(eventId, reason) {
  return apiRequest(`/np/approvals/${eventId}/reject`, { method: 'POST', body: { reason } });
}
export function requestChanges(eventId, feedback) {
  return apiRequest(`/np/approvals/${eventId}/request-changes`, { method: 'POST', body: { feedback } });
}
export function getAutopilot() {
  return apiRequest('/np/autopilot');
}
export function updateAutopilot({ enabled, checks }) {
  return apiRequest('/np/autopilot', { method: 'PATCH', body: { enabled, checks } });
}
export function addTrustedSe(seUserId) {
  return apiRequest('/np/autopilot/trusted-ses', { method: 'POST', body: { se_user_id: seUserId } });
}
export function removeTrustedSe(seUserId) {
  return apiRequest(`/np/autopilot/trusted-ses/${seUserId}`, { method: 'DELETE' });
}

// nonprofits.js
export function getNpProfile() {
  return apiRequest('/np/profile');
}
export function updateNpProfile(body) {
  return apiRequest('/np/profile', { method: 'PATCH', body });
}
```

Confirm queue response shape in `approval_service.list_queue` before adapting UI.

- [ ] **Commit** `feat(app): add NP dashboard, approvals, and profile API modules`

---

### Task 2: Launchpad (mobile + desktop)

Replace `events` mock with `getNpLaunchpad()`. Map `stats`, `live_events`, `action_required` into existing cards. Loading/error/empty.

- [ ] **Commit** `feat(app): wire NP launchpad to live API`

---

### Task 3: Activity + Financials (mobile + desktop)

`getNpActivity` / `getNpFinancials`. Map `backing_by_event` / `revenue_by_event` / settlement fields. Keep `eventDisplayTitle` helper if still used as pure formatter (move or keep chrome import OK).

- [ ] **Commit** `feat(app): wire NP activity and financials to live API`

---

### Task 4: NP Profile

`getNpProfile` + `updateNpProfile` on save. Mobile `NpProfile.jsx` (+ desktop twin if any).

- [ ] **Commit** `feat(app): wire NP profile to live API`

---

### Task 5: Approvals queue + review + request-changes

Wire `NpApprovals`, `DesktopNpApprovals`, `NpReviewDetail`, `DesktopNpReviewDetail`, `NpRequestChanges` (+ desktop if exists).

Use route params for `eventId` where possible; update App.jsx routes if currently hardcoded `/np/approvals/review` without id — prefer `/np/approvals/:eventId` and `/np/approvals/:eventId/request-changes` **only if** routes already support params; else pass id via query `?id=` to avoid large router churn.

Mutations: approve/reject/requestChanges + toast + navigate back to queue.

- [ ] **Commit** `feat(app): wire NP approvals queue and actions to live API`

---

### Task 6: Autopilot + trusted SEs

`NpAutopilot` + `DesktopNpAutopilot`: load getAutopilot; toggle updateAutopilot; removeTrustedSe; addTrustedSe if UI has add flow (if only hardcoded list remove, wire remove + refresh).

- [ ] **Commit** `feat(app): wire NP autopilot and trusted SEs to live API`

---

### Task 7: B4 exit

Grep NP screens for primary mockData; write `b4-exit-report.md`; fix Critical only.

---

## Self-review vs §B4

Launchpad/activity/financials/profile → Tasks 2–4; Approvals → 5; Autopilot → 6.
