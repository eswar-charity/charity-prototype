# Event Community + Polled Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire live event Community (posts + gallery image fallback) and Chat (REST + 2.5s polling) on mobile and desktop, with minimal backend enrichment (`media_url` + seed messages).

**Architecture:** Enrich feed post/reply reads with `media_url`. Frontend `api/feed.js` + adapters + `useEventChat` / `useEventCommunity` hooks. Gallery fallback via `getCommunityPhotos` / event `photos`. No WebSockets.

**Tech Stack:** FastAPI + existing feed models; Vite/React; `node:test` for adapters; pytest for media_url.

**Spec:** `docs/superpowers/specs/2026-07-24-event-community-chat-design.md`

## Global Constraints

- Branch: **`thread-test` only** (no new branch).
- Preserve Community/Chat UI; no redesign; no WebSockets.
- Poll 2.5s while Chat tab open; pause when `document.hidden`.
- Community: API posts first; fill missing media from gallery; synthesize thread if no posts.
- Stage task-scoped files; commit per task.

## File structure

| Path | Responsibility |
|------|----------------|
| `backend/app/services/feed_service.py` | Add `media_url` on post/reply reads |
| `backend/tests/test_feed.py` (or existing) | Assert `media_url` |
| `backend/seed/seed.py` | Seed chat messages for catalog events if empty |
| `charity-app/src/api/feed.js` | listPosts, listMessages, sendMessage |
| `charity-app/src/api/adapters/feed.js` | adapt posts/messages + gallery helpers |
| `charity-app/src/api/adapters/feed.test.js` | node:test |
| `charity-app/src/hooks/useEventCommunity.js` | fetch posts + adapt |
| `charity-app/src/hooks/useEventChat.js` | poll + send |
| `EventDetailLive.jsx`, `DesktopEventDetail.jsx` | wire hooks |

---

### Task 1: Backend media_url on posts/replies

**Files:**
- Modify: `backend/app/services/feed_service.py`
- Modify: `backend/tests/test_feed.py` (create if missing; extend if present)

**Interfaces:**
- `_post_read` / `_reply_read` include `media_url: str | None`

- [ ] **Step 1: Find existing feed tests; add failing assert for media_url**

```python
# In an API test that creates a post with media_id pointing at a MediaAsset:
assert body["items"][0].get("media_url") == media.secure_url
# Or detail of single post create response
assert data["media_url"] == "https://example.com/img.jpg"
```

- [ ] **Step 2: Implement enrichment**

```python
from app.repositories import media_repository

async def _media_url(db, media_id: int | None) -> str | None:
    if not media_id:
        return None
    m = await media_repository.get_by_id(db, media_id)
    return m.secure_url if m else None

async def _reply_read(db, reply, author):
    return {
        ...
        "media_id": reply.media_id,
        "media_url": await _media_url(db, reply.media_id),
        ...
    }

async def _post_read(...):
    # make _reply_read async with db; add media_url on post
```

- [ ] **Step 3: Run** `cd backend && .venv\Scripts\python -m pytest tests/test_feed.py -q` (or targeted test) — PASS

- [ ] **Step 4: Commit** `feat(api): include media_url on feed post and reply reads`

---

### Task 2: Seed chat messages

**Files:**
- Modify: `backend/seed/seed.py`

- [ ] **Step 1: After events exist, if no ChatMessage for neon (or each catalog event), insert 3–4 messages** (host + guests). Use Mike as host; reuse guest_lead if available or Mike for simplicity for extra lines.

```python
from app.models.post import ChatMessage
# count messages for event; if 0, session.add_all([...])
```

- [ ] **Step 2: Commit** `feat(seed): add demo chat messages for catalog events`

---

### Task 3: Frontend feed API + adapters

**Files:**
- Create: `charity-app/src/api/feed.js`
- Create: `charity-app/src/api/adapters/feed.js`
- Create: `charity-app/src/api/adapters/feed.test.js`

```js
// feed.js
export function listPosts(key, { page = 1, limit = 50 } = {}) {
  return apiRequest(`/events/${encodeURIComponent(key)}/posts?page=${page}&limit=${limit}`, { auth: false });
}
export function listMessages(key, { page = 1, limit = 50 } = {}) {
  return apiRequest(`/events/${encodeURIComponent(key)}/messages?page=${page}&limit=${limit}`);
}
export function sendMessage(eventId, text) {
  return apiRequest(`/events/${eventId}/messages`, { method: 'POST', body: { text } });
}
```

```js
// adapters/feed.js
export function galleryUrlsForEvent(ev) {
  const fromApi = (ev?.photos || []).filter((u) => typeof u === 'string' && u.length > 0);
  if (fromApi.length) return fromApi.slice();
  // import getCommunityPhotos from eventData/mockData
  return getCommunityPhotos(ev || { key: ev?.key }).slice();
}

export function adaptCommunityPosts(items, galleryUrls, ev) {
  const pool = galleryUrls.slice();
  if (!items?.length) {
    return synthesizeGalleryThread(pool, ev);
  }
  return items.map((p) => {
    const author = p.author || {};
    const media = p.media_url || (pool.length ? pool.shift() : null);
    return {
      id: p.id,
      phase: p.phase || 'during',
      name: author.name || 'Member',
      initials: author.initials || '?',
      avatarBg: author.color
        ? `linear-gradient(135deg, ${author.color}, ${author.color}99)`
        : 'linear-gradient(135deg,var(--primary),var(--blue))',
      time: formatRelative(p.created_at), // simple locale time or relative
      host: !!p.host,
      verified: !!p.verified,
      highlight: p.highlight || null,
      text: p.text,
      media,
      mediaAlt: p.media_alt || (media ? `Photo shared by ${author.name || 'member'}` : null),
      mediaSize: 'attachment',
      replies: (p.replies || []).map(...similar...),
    };
  });
}

export function synthesizeGalleryThread(galleryUrls, ev) {
  return galleryUrls.map((url, i) => ({
    id: `gallery-${ev?.key || 'ev'}-${i}`,
    phase: i === 0 ? 'before' : 'during',
    name: ev?.organizer || 'Host',
    initials: ev?.initials || 'H',
    avatarBg: 'linear-gradient(135deg,var(--primary),var(--blue))',
    time: '',
    host: true,
    verified: true,
    text: i === 0 ? 'Moments from this event' : null,
    media: url,
    mediaAlt: `Event photo ${i + 1}`,
    mediaSize: 'attachment',
    replies: [],
  }));
}

export function adaptChatMessage(m, currentUserId) {
  const author = m.author || {};
  const mine = currentUserId != null && author.id === currentUserId;
  return {
    id: m.id,
    name: author.name,
    initials: mine ? 'ME' : (author.initials || '?'),
    avatar: author.color
      ? `linear-gradient(135deg, ${author.color}, ${author.color}99)`
      : 'linear-gradient(135deg,var(--primary),var(--blue))',
    host: !!m.host,
    verified: !!m.verified,
    text: m.text,
    reaction: m.reaction,
    mine,
    sent: mine ? 'Sent' : undefined,
  };
}
```

- [ ] **TDD:** tests for empty→synthesize, media_url preferred over gallery, gallery fill when media_url null
- [ ] **Commit** `feat(app): add feed API module and community/chat adapters`

---

### Task 4: useEventCommunity + useEventChat hooks

**Files:**
- Create: `charity-app/src/hooks/useEventCommunity.js`
- Create: `charity-app/src/hooks/useEventChat.js`

`useEventCommunity(ev)` → `{ posts, loading, error, reload }`  
`useEventChat({ eventKey, eventId, enabled, currentUserId, showToast })` → `{ messages, loading, error, send, pending }`

Poll implementation:

```js
useEffect(() => {
  if (!enabled || !eventKey) return undefined;
  let cancelled = false;
  const tick = async () => {
    if (document.hidden) return;
    try {
      const data = await listMessages(eventKey);
      if (!cancelled) setMessages((data.items || []).map((m) => adaptChatMessage(m, currentUserId)));
    } catch (e) { /* keep last good; optional setError */ }
  };
  tick();
  const id = setInterval(tick, 2500);
  const onVis = () => { if (!document.hidden) tick(); };
  document.addEventListener('visibilitychange', onVis);
  return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
}, [enabled, eventKey, currentUserId]);
```

- [ ] **Commit** `feat(app): add useEventCommunity and useEventChat hooks`

---

### Task 5: Wire EventDetailLive + DesktopEventDetail

**Files:**
- Modify: `charity-app/src/screens/guests/EventDetailLive.jsx`
- Modify: `charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx`

- Remove `buildChatSeed` / `buildCommunityThread` usage from these screens.
- CommunityTab: use `useEventCommunity(ev)`; show loading/error.
- Chat: `enabled={activeTab==='chat' && isAuthenticated}`; wire send to hook; keep GuestChatGate.

- [ ] **Commit** `feat(app): wire live event community and polled chat`

---

### Task 6: Exit check

- Grep live detail for `buildChatSeed` / `buildCommunityThread`
- Run frontend adapter tests + backend feed test
- Write `.superpowers/sdd/community-chat-exit-report.md`

---

## Self-review vs spec

| Spec | Task |
|------|------|
| media_url | 1 |
| seed chat | 2 |
| feed API + adapters + gallery C | 3 |
| polling hook | 4 |
| mobile + desktop wire | 5 |
| no WebSockets | all |
