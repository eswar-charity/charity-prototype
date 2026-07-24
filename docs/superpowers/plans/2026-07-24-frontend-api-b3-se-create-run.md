# Frontend API Integration — Slice B3 SE Create & Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire SE event wizard (create/update/save-draft/submit), approval lifecycle display + go-live/complete, live + post-event dashboards, SE feed/profile, and notification bell to live FastAPI — preserving UI.

**Architecture:** Extend `api/events.js` with SE mutations; add `api/media.js` + `api/notifications.js`. Persist `serverEventId` / `serverKey` on `useCreateEventDraft`. Map UI draft → `EventCreateRequest`/`EventUpdateRequest`. Dashboards via `GET /se/live-dashboard/{key}` and `GET /se/post-event/{key}`. Media: signed Cloudinary when available; if sign fails, keep local object URLs and submit without `cover_media_id` (do not invent backend).

**Tech Stack:** B0–B2 client/auth/adapters/`listEvents`/`listNonprofits`. Branch: **`thread-test` only**.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` §B3.

## Global Constraints

- Preserve UI/UX; mobile + desktop twins.
- No new backend endpoints. No new branches.
- SE cannot NP-approve: remove/disable prototype “Approve event” CTA on ApprovalStatus; show real `event.status` and wire **Go live** / **Complete** only when status allows.
- Demo login: `mike.rivera@demo.charityhub.com` / `Passw0rd!` (SE).
- Stage task-scoped files; commit per task on `thread-test`.
- Chat/QR check-in may stay mock if already noted for later; prefer wiring `POST /events/{id}/updates` for live dashboard post if UI has post update (optional stretch in Task 4).
- Out of scope: NP/Admin (B4–B5), guest donate (B2 done).

## File structure

| Path | Responsibility |
|------|----------------|
| `api/events.js` | + createEvent, updateEvent, saveDraft, submitEvent, goLive, completeEvent |
| `api/media.js` | signUpload, createMediaAsset |
| `api/notifications.js` | listMine, markRead |
| `hooks/useCreateEventDraft.js` | + serverEventId, serverKey; mapDraftToPayload |
| `utils/eventDraftPayload.js` | pure mapper + tests |
| EventStep1–4 + Desktop twins | live NP list; save/submit API |
| ApprovalStatus + Desktop | status from API; goLive/complete |
| LiveDashboard, PostEventImpact + Desktop | SE dashboard APIs |
| FeedScreen, ProfileScreen + Desktop | live events for SE |
| NotificationBell | live `/me/notifications` when items not passed |

---

### Task 1: SE API modules (events mutations, media, notifications)

**Files:**
- Modify: `charity-app/src/api/events.js`
- Create: `charity-app/src/api/media.js`
- Create: `charity-app/src/api/notifications.js`

**Interfaces:**
- `createEvent(body)` → `POST /events`
- `updateEvent(eventId, body)` → `PATCH /events/{id}`
- `saveDraft(eventId, body)` → `POST /events/{id}/save-draft`
- `submitEvent(eventId)` → `POST /events/{id}/submit`
- `goLive(eventId)` → `POST /events/{id}/go-live`
- `completeEvent(eventId)` → `POST /events/{id}/complete`
- `signUpload({ folder, resourceType })` → `POST /media/sign`
- `createMediaAsset(body)` → `POST /media`
- `listNotifications()` → `GET /me/notifications`
- `markNotificationRead(id)` → `PATCH /notifications/{id}/read`
- `getSeLiveDashboard(key)` / `getSePostEvent(key)` — add to new `api/dashboards.js` OR `events.js`; prefer `api/dashboards.js`:
  - `getSeLiveDashboard(key)` → `GET /se/live-dashboard/{key}`
  - `getSePostEvent(key)` → `GET /se/post-event/{key}`

- [ ] **Step 1: Extend events.js**

```js
export function createEvent(body) {
  return apiRequest('/events', { method: 'POST', body });
}
export function updateEvent(eventId, body) {
  return apiRequest(`/events/${eventId}`, { method: 'PATCH', body });
}
export function saveDraft(eventId, body) {
  return apiRequest(`/events/${eventId}/save-draft`, { method: 'POST', body });
}
export function submitEvent(eventId) {
  return apiRequest(`/events/${eventId}/submit`, { method: 'POST' });
}
export function goLive(eventId) {
  return apiRequest(`/events/${eventId}/go-live`, { method: 'POST' });
}
export function completeEvent(eventId) {
  return apiRequest(`/events/${eventId}/complete`, { method: 'POST' });
}
```

Body keys snake_case per schema: `nonprofit_id`, `start_time`, `end_time`, `cover_media_id`, `tags`.

- [ ] **Step 2: media.js + notifications.js + dashboards.js**

```js
// media.js
export function signUpload({ folder = 'events', resourceType = 'image' } = {}) {
  return apiRequest('/media/sign', {
    method: 'POST',
    body: { folder, resource_type: resourceType },
  });
}
export function createMediaAsset(payload) {
  return apiRequest('/media', { method: 'POST', body: payload });
}

// notifications.js
export function listNotifications() {
  return apiRequest('/me/notifications');
}
export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}

// dashboards.js
export function getSeLiveDashboard(key) {
  return apiRequest(`/se/live-dashboard/${encodeURIComponent(key)}`);
}
export function getSePostEvent(key) {
  return apiRequest(`/se/post-event/${encodeURIComponent(key)}`);
}
```

- [ ] **Step 3: Commit**

```bash
git add charity-app/src/api/events.js charity-app/src/api/media.js charity-app/src/api/notifications.js charity-app/src/api/dashboards.js
git commit -m "feat(app): add SE event mutation, media, notifications, dashboard APIs"
```

---

### Task 2: Draft payload mapper + draft store server ids

**Files:**
- Create: `charity-app/src/utils/eventDraftPayload.js`
- Create: `charity-app/src/utils/eventDraftPayload.test.js`
- Modify: `charity-app/src/hooks/useCreateEventDraft.js`

**Interfaces:**
- `mapDraftToApiPayload(draft)` → `{ title, story, nonprofit_id, category, date, start_time, end_time, location, visibility, cover_media_id?, tags? }`
- Draft fields: add `serverEventId: null`, `serverKey: null`, `coverMediaId: null`, `title` derived from story hashtag or first line if missing

- [ ] **Step 1: Test + implement mapper**

Title: use `draft.title` if set; else `previewHashtag(draft.story).replace(/^#/, '')` or `'Untitled event'`.
Date: pass through draft.startDate string as `date` (API stores display strings today).
`nonprofit_id`: Number(draft.nonprofitId).
`visibility`: draft.visibility || 'public'.

- [ ] **Step 2: Extend DEFAULT_DRAFT** with `serverEventId`, `serverKey`, `coverMediaId`, `title: ''`, and set `nonprofitId: null` (UI picks from live list). Keep photo defaults for empty preview chrome OK.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(app): map event wizard draft to API payload"
```

---

### Task 3: Wizard steps — NP list + save/submit (mobile + desktop)

**Files:**
- Modify: `EventStep2.jsx`, `DesktopEventStep2.jsx` — `listNonprofits` instead of mock `nonprofits`
- Modify: `EventStep4.jsx`, `DesktopEventStep4.jsx` — create/saveDraft/submit
- Optionally Step1: if user picks files, attempt media sign+Cloudinary unsigned upload using sign response fields; on failure keep blob URL only

**Save draft flow:**
1. Ensure authenticated SE (`useAuth`); if not, toast + navigate create-account/login.
2. `payload = mapDraftToApiPayload(draft)`
3. If no `serverEventId`: `createEvent(payload)` → store id/key via `updateDraft`
4. Else: `saveDraft(serverEventId, payload)`
5. Toast success; navigate `/feed` on save

**Submit flow:**
1. Same ensure event exists (create or saveDraft first)
2. `submitEvent(serverEventId)`
3. `resetDraft()` optional after navigate; prefer keep key: `navigate(\`/approval?event=${key}\`)` or `/approval/${key}` — use query `?key=` to avoid App.jsx route churn: `navigate('/approval?key=' + encodeURIComponent(key))`

- [ ] **Step 1–2: Wire Step2 NP picker + Step4 actions** (both mobile and desktop)
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(app): wire SE event wizard save/submit to live API"
```

---

### Task 4: Approval status + go-live / complete

**Files:**
- Modify: `ApprovalStatus.jsx`, `DesktopApprovalStatus.jsx`

Map API `event.status` (and `is_live`) into UI states:
- Pending / Submitted / In review → `review`
- Approved → `approved`
- Live → `live`
- Completed → `completed`

Load: `getEvent(key)` from `?key=` or path param; fallback first owned live event via `listEvents` + filter `organizer.id === user.id` if no key (document).

Actions:
- **Remove** SE “Approve event” primary that fakes NP approval (or hide when not platform demo — prefer remove).
- `approved` → Go live → `goLive(event.id)` then refresh
- `live` → Complete → `completeEvent(event.id)` then refresh
- `completed` → navigate `/post-event?key=...`

- [ ] **Step 1: Implement**
- [ ] **Step 2: Commit** `feat(app): wire SE approval status to live event lifecycle`

---

### Task 5: Live dashboard + post-event impact

**Files:**
- Modify: `LiveDashboard.jsx`, `DesktopLiveDashboard.jsx`
- Modify: `PostEventImpact.jsx`, `DesktopPostEventImpact.jsx`

Load `getSeLiveDashboard(key)` / `getSePostEvent(key)` with key from query or default seeded event key owned by Mike (e.g. from list). Adapt stats into existing UI numbers. Replace `events[0]` mock.

Optional: post update via `POST /events/{id}/updates` if feed API exists (`feed.py`) — wire if button exists and endpoint known:

```js
// api/feed.js or events.js
export function postEventUpdate(eventId, text) {
  return apiRequest(`/events/${eventId}/updates`, { method: 'POST', body: { text } });
}
```

Confirm body shape in `backend/app/api/v1/feed.py` before wiring.

- [ ] **Step 1–2: Wire screens**
- [ ] **Step 3: Commit** `feat(app): wire SE live and post-event dashboards`

---

### Task 6: SE feed + profile

**Files:**
- Modify: `FeedScreen.jsx`, `DesktopFeedScreen.jsx`
- Modify: `ProfileScreen.jsx`, `DesktopProfileScreen.jsx`

Reuse `usePagedFeed` / `listEvents` + `adaptEvent`. Filter client-side to `organizer.id === user.id` for “my events” sections if API has no organizer filter. Profile: `GET /me/profile` via existing `users.js` + events list.

- [ ] **Commit** `feat(app): wire SE feed and profile to live events`

---

### Task 7: Notification bell live data

**Files:**
- Modify: `NotificationBell.jsx` and call sites that pass `SE_FEED_NOTIFICATIONS` / `NP_NOTIFICATIONS`

When `items` prop omitted, fetch `listNotifications()`, map `{ id, title: type, body: text, unread: !read, time: created_at, route: infer optional }`. On open item, `markNotificationRead`. Keep static arrays as fallback export for Storybook-less demos only if a screen still needs them — prefer live.

- [ ] **Commit** `feat(app): wire notification bell to /me/notifications`

---

### Task 8: B3 exit criteria

- [ ] Grep SE screens for `from '../data/mockData'` / `events[0]` primary data — should be gone or chrome-only
- [ ] Run any new `node --test` files
- [ ] Write `.superpowers/sdd/b3-exit-report.md`

---

## Self-review vs spec §B3

| Spec | Task |
|------|------|
| Wizard create/update/save-draft/submit | 1–3 |
| Media sign/upload where wizard uploads | 3 (best-effort) |
| Approval status | 4 |
| Live + post-event | 5 |
| SE feed/profile | 6 |
| Notification bell | 7 |
