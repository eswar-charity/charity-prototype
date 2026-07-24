# Frontend API Integration — Slice B1 Guest Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace guest discovery mocks with live `GET /events` (filters + pagination), event detail, backers, like/save, and public nonprofit profile so Guest browse works end-to-end against local FastAPI.

**Architecture:** Domain API modules + adapters mapping `EventRead`/`NonprofitRead` → existing UI field names (`isLive`, `mission`, `nonprofit` string, etc.). Server-driven pagination via a new `usePagedFeed` hook (do not fake-cycle the same array). Keep path helpers and category icons; fall back to CSS event banners by `key` when no cover URL.

**Tech Stack:** Existing Vite/React, B0 `api/client.js` + `useAuth`/`useAppToast`, native fetch. Node `node:test` for adapter pure functions.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` §B1.

**Depends on:** B0 complete (`api/client`, AuthProvider). Backend running on `http://localhost:8000` with seeded events.

## Global Constraints

- Preserve UI/UX (mobile + desktop twins); no redesign.
- Do not remove AccessGate or B0 auth.
- Keep `categoryIcons.js`, `event-images.css` / banner-by-key fallback, How-it-works / Causes marketing pages static.
- No organizer public API exists — organizer profile uses `event.organizer` + `GET /events` filtered client-side or list all and filter by organizer id/name (document limitation).
- Like/save/join require auth — guests without token: navigate to identity-gate / create-account as existing UX; if token present, call API + toast.
- Stage only task-scoped paths; commit per task.
- Tests: adapter `node --test`; manual smoke with uvicorn + Vite.

## File structure

| Path | Responsibility |
|------|----------------|
| `charity-app/src/api/events.js` | feed, getByKey, backers, like, save, join |
| `charity-app/src/api/nonprofits.js` | list, getBySlug |
| `charity-app/src/api/adapters/event.js` | `adaptEvent(api)` → UI event shape |
| `charity-app/src/api/adapters/nonprofit.js` | `adaptNonprofit` / profile |
| `charity-app/src/api/adapters/event.test.js` | node:test |
| `charity-app/src/hooks/usePagedFeed.js` | page/limit fetch + sentinel |
| `charity-app/src/utils/eventPaths.js` | move `eventDetailPath` / live/upcoming helpers off mockData (pure) |
| Screens: GuestFeed, DesktopGuestFeed, EventDetail*, Desktop*, NpPublicProfile, OrganizerProfile | live data |

---

### Task 1: Event + nonprofit API modules

**Files:**
- Create: `charity-app/src/api/events.js`
- Create: `charity-app/src/api/nonprofits.js`

**Interfaces:**
- `listEvents({ cause, discovery, page=1, limit=20 })` → `EventListResponse` via `GET /events?...`
- `getEvent(key)` → `EventRead` via `GET /events/{key}`
- `getBackers(key)` → backers payload
- `likeEvent(eventId)`, `saveEvent(eventId)`, `joinEvent(eventId)` → POST (auth)
- `listNonprofits({ q, category, page, limit })` → list response
- `getNonprofit(slug)` → `NonprofitProfileResponse`

- [ ] **Step 1: Implement events.js**

```js
import { apiRequest } from './client.js';

export function listEvents({ cause, discovery, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (cause && cause !== 'All') params.set('cause', cause);
  if (discovery && discovery !== 'All') params.set('discovery', discovery);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiRequest(`/events?${params}`, { auth: false });
}

export function getEvent(key) {
  return apiRequest(`/events/${encodeURIComponent(key)}`, { auth: false });
}

export function getBackers(key) {
  return apiRequest(`/events/${encodeURIComponent(key)}/backers`, { auth: false });
}

export function likeEvent(eventId) {
  return apiRequest(`/events/${eventId}/like`, { method: 'POST' });
}

export function saveEvent(eventId) {
  return apiRequest(`/events/${eventId}/save`, { method: 'POST' });
}

export function joinEvent(eventId) {
  return apiRequest(`/events/${eventId}/join`, { method: 'POST' });
}
```

Query params: `cause` (category string) and `discovery`. Map UI discovery labels to API values used by `event_repository.list_feed`: `'Live now'` → `live`, `'Popular'` → `popular`, `'New'` → `new`, `'Following'` → omit or empty (API has no following filter — show empty client-side). `'All'` → omit param.

- [ ] **Step 2: Implement nonprofits.js**

```js
import { apiRequest } from './client.js';

export function listNonprofits({ q, category, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set('q', q);
  if (category && category !== 'All') params.set('category', category);
  return apiRequest(`/nonprofits?${params}`, { auth: false });
}

export function getNonprofit(slug) {
  return apiRequest(`/nonprofits/${encodeURIComponent(slug)}`, { auth: false });
}
```

Confirm list query param names in `nonprofits.py` / service.

- [ ] **Step 3: Manual curl smoke**

```powershell
curl -s "http://localhost:8000/api/v1/events?page=1&limit=5"
curl -s "http://localhost:8000/api/v1/events/neon-night"
```

Expected: JSON with `items` / event `key`.

- [ ] **Step 4: Commit**

```powershell
git add charity-app/src/api/events.js charity-app/src/api/nonprofits.js
git commit -m "feat(app): add events and nonprofits API modules for guest discovery"
```

---

### Task 2: Adapters + path utils + tests

**Files:**
- Create: `charity-app/src/api/adapters/event.js`
- Create: `charity-app/src/api/adapters/nonprofit.js`
- Create: `charity-app/src/api/adapters/event.test.js`
- Create: `charity-app/src/utils/eventPaths.js`
- Modify: `mockData.js` — re-export path helpers from `eventPaths` for backward compat (optional thin re-export)

**Interfaces:**
- `adaptEvent(apiEvent)` returns UI shape:

```js
{
  id, key, title,
  mission: apiEvent.story ?? apiEvent.subtitle ?? '',
  category: apiEvent.category,
  isLive: !!apiEvent.is_live,
  date, startTime: start_time, endTime: end_time, location,
  backed, joined, updates, chat: chat_count, raised,
  nonprofit: apiEvent.nonprofit?.name ?? '',
  nonprofitSlug: apiEvent.nonprofit?.slug ?? '',
  organizer: apiEvent.organizer?.name ?? '',
  organizerId: apiEvent.organizer?.id,
  tags: apiEvent.tags ?? [],
  photos: apiEvent.photos ?? [],
  // keep nested briefs for detail screens
  nonprofitBrief: apiEvent.nonprofit,
  organizerBrief: apiEvent.organizer,
}
```

- `eventDetailPath(ev, opts)` uses `ev.isLive` + `ev.key` (same as today)
- `eventDisplayTitle(title)` — move from eventData/mockData if needed, or import existing

- [ ] **Step 1: Failing test**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adaptEvent } from './event.js';

describe('adaptEvent', () => {
  it('maps snake_case and nested briefs', () => {
    const ui = adaptEvent({
      id: 1, key: 'neon-night', title: '#NeonNight', story: 'Party',
      category: 'Community', kind: 'SE-led', status: 'Live', visibility: 'public',
      is_live: true, date: 'Nov 14, 2026', start_time: '7:00 PM', end_time: '10:00 PM',
      location: 'Brooklyn', backed: 213, joined: 87, updates: 38, chat_count: 212, raised: 14280,
      nonprofit: { id: 1, name: 'United Way', slug: 'united-way', verified: true },
      organizer: { id: 2, name: 'Mike Rivera', initials: 'MR', color: '#C62828' },
      tags: [], photos: [],
    });
    assert.equal(ui.isLive, true);
    assert.equal(ui.mission, 'Party');
    assert.equal(ui.nonprofit, 'United Way');
    assert.equal(ui.chat, 212);
    assert.equal(ui.startTime, '7:00 PM');
  });
});
```

- [ ] **Step 2: Run — FAIL** then implement adapter — PASS

```powershell
cd charity-app
node --test src/api/adapters/event.test.js
```

- [ ] **Step 3: eventPaths.js** — copy `eventLivePath`, `eventUpcomingPath`, `eventDetailPath` from mockData (depend only on `ev.isLive` / `ev.key`).

- [ ] **Step 4: Commit**

```powershell
git commit -m "feat(app): add event/nonprofit adapters and event path utils"
```

---

### Task 3: `usePagedFeed` hook

**Files:**
- Create: `charity-app/src/hooks/usePagedFeed.js`

**Interfaces:**
- `usePagedFeed(fetcher, { pageSize = 10, deps = [] })`
  - `fetcher({ page, limit })` → `{ items, total, has_more }`
  - Returns `{ items, loading, error, hasMore, sentinelRef, reload }`
  - On deps change, reset to page 1
  - Sentinel IntersectionObserver loads `page+1` when `has_more`

Do **not** recycle/cycle the same items (old `useInfiniteScroll` behavior). Keep `useInfiniteScroll.js` for any non-B1 screens still using mocks.

- [ ] **Step 1: Implement hook** (fetcher receives adapted items already, or adapt inside GuestFeed — prefer adapt in screen/hook consumer)

Example consumer pattern:

```js
const fetcher = useCallback(async ({ page, limit }) => {
  const res = await listEvents({ cause: activeCategory, discovery: mapDiscovery(activeDiscovery), page, limit });
  return { items: res.items.map(adaptEvent), total: res.total, has_more: res.has_more };
}, [activeCategory, activeDiscovery]);
```

- [ ] **Step 2: Manual** — hook unit not required; covered by Task 4 smoke

- [ ] **Step 3: Commit**

```powershell
git commit -m "feat(app): add usePagedFeed for server-driven event lists"
```

---

### Task 4: GuestFeed + DesktopGuestFeed

**Files:**
- Modify: `GuestFeed.jsx`, `DesktopGuestFeed.jsx` (and SE `FeedScreen` / `DesktopFeedScreen` if they share the same mock list — wire those too if they import `events` the same way for discovery; if SE feed is “your events”, defer to B3 and only do Guest*)

**Scope for B1:** Guest feeds only. SE FeedScreen stays mock until B3 unless it’s identical guest discovery — check imports; if SE feed is the same Scene UI, wire it here too.

- [ ] **Step 1:** Replace `events` filter with `usePagedFeed` + API
- [ ] **Step 2:** Loading / empty / error UI (reuse empty feed patterns; toast or inline error)
- [ ] **Step 3:** Keep filters `ALL_BROWSE_FILTERS` / `DISCOVERY_FILTERS` from categoryIcons + static list (may still import filter constants from mockData or move constants to `constants/browse.js` — prefer importing `BROWSE_CATEGORIES` from categoryIcons only)
- [ ] **Step 4:** Banner still uses `EventImageBanner` + `getEventBannerFocus(ev.key)` fallback
- [ ] **Step 5:** Navigate via `eventDetailPath(ev, { loggedIn: false })`
- [ ] **Step 6:** Mirror desktop
- [ ] **Step 7: Manual smoke** — Vite + API: feed shows United Way / St. Jude events; category filter works; scroll loads more if `has_more`
- [ ] **Step 8: Commit**

```powershell
git commit -m "feat(app): wire guest feeds to live events API"
```

---

### Task 5: Event detail (live + upcoming, mobile + desktop)

**Files:**
- Modify: `EventDetailLive.jsx`, `EventDetailUpcoming.jsx`, `DesktopEventDetail.jsx`, `DesktopEventDetailUpcoming.jsx`
- Possibly shared modals that read `getEventByKey`

**Behavior:**
- `useParams().eventKey` → `getEvent(key)` → `adaptEvent`
- Loading/error states
- Backers modal: `getBackers(key)`
- Like/save: if `useAuth().isAuthenticated` call API + toast; else navigate to identity-gate / signup as existing buttons do
- Join CTA: same auth gate (full join+donate flow is B2 — for B1, calling `joinEvent` when authed is OK; unauthed keeps gate navigation)
- Nonprofit “learn more” uses `nonprofitSlug` → `/np/...` public profile route if exists
- Keep community thread / chat mock for B1 if posts/messages not in this slice — **B1 scope:** detail header/stats/backers/like/save from API; posts/chat may remain seed-static until a later feed slice **or** wire `GET /events/{key}/posts` if quick. Prefer wiring posts read-only if endpoint is trivial; otherwise leave mock thread and note in report.

**Decision for this plan:** Wire event core + backers + like/save. Leave chat/posts on mock until B2/B3 unless already one fetch — check screen; if tightly coupled, fetch posts in same task with `api/feed.js` minimal `listPosts(key)`.

Minimal feed module if needed:

```js
// api/feed.js
export function listPosts(key) {
  return apiRequest(`/events/${encodeURIComponent(key)}/posts`, { auth: false });
}
```

- [ ] Implement mobile live + upcoming
- [ ] Mirror desktop
- [ ] Manual: open `/guest/event/live/neon-night` shows live API data
- [ ] Commit: `feat(app): wire guest event detail screens to live API`

---

### Task 6: Public NP profile + organizer profile

**Files:**
- Modify: `DesktopNpPublicProfile.jsx`, `DesktopOrganizerProfile.jsx` (and mobile equivalents if any)

**NP profile:** `getNonprofit(slug)` → show mission, stats, events list from response `events` field (adapt each).

**Organizer profile:** No `/organizers/{slug}` API. Approach:
1. Parse slug from route
2. `listEvents({ page: 1, limit: 50 })`, adapt, filter where `slugify(organizer) === slug` OR `organizerBrief` name slug matches
3. Header from first match’s `organizerBrief`

Document in code comment: temporary until organizers endpoint exists.

- [ ] Implement NP profile
- [ ] Implement organizer profile workaround
- [ ] Manual smoke
- [ ] Commit: `feat(app): wire public nonprofit and organizer profiles to live data`

---

### Task 7: Share / QR (optional polish)

**Files:** Share sheet / ShareQRModal if they need live event id

- If modal only needs URL from `event.key`, no API required — skip.
- If it calls QR API: `GET /events/{id}/qr` with numeric `id` from adapted event.

- [ ] Wire only if screen currently hardcodes mock QR payload
- [ ] Else mark N/A in report and skip commit

---

## B1 exit criteria

- [ ] Guest feed (mobile+desktop) lists live seeded events with filters + real pagination
- [ ] Event detail live/upcoming load by `key` from API
- [ ] Backers from API; like/save work when authenticated
- [ ] NP public profile from API; organizer profile best-effort from events
- [ ] Adapters tested with `node --test`
- [ ] No Guest discovery screen still importing `events` array from mockData for primary data

## Out of scope (later slices)

- Donate/join payment identity completion (B2)
- SE wizard / live dashboard (B3)
- NP approvals (B4)
- Admin (B5)
- Building `/organizers/{slug}` backend endpoint

## Plan self-review

| Spec B1 item | Task |
|--------------|------|
| Feed + filters + pagination | 1, 3, 4 |
| Event detail | 5 |
| Backers / like / save | 1, 5 |
| NP + organizer profiles | 6 |
| Share/QR | 7 |
| Preserve banners/icons | 4–5 fallbacks |
