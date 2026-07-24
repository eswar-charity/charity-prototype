# Event Community Thread + Polled Chat — Design

**Date:** 2026-07-24  
**Status:** Approved in conversation — pending user review of this written spec  
**Branch:** `thread-test` (no new branch)  
**Depends on:** Existing FastAPI feed routes (`/events/{key}/posts`, `/events/{key}/messages`) and B1 live event detail

---

## 1. Objective

On live event detail (mobile + desktop):

1. **Community** — show event-related images in the thread (not text-only mock timelines).
2. **Chat** — replace static seed messages with live REST chat, kept current via short-interval polling (no WebSockets).

Preserve existing Community/Chat UI chrome.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Real-time | **Polling** every 2.5s while Chat tab is open; pause when `document.hidden` |
| Community data | **C** — prefer `GET /events/{key}/posts` + media; if no posts, synthesize photo thread from event gallery |
| Missing post media | Attach unused gallery / banner-by-`key` photos so posts aren’t text-only |
| Scope | Mobile + desktop live event detail Community + Chat tabs |
| WebSockets | Out of scope |
| Chat media / typing / read receipts | Out of scope |

---

## 3. Backend changes (minimal)

### 3.1 Enrich post/reply reads with media URL

Today `_post_read` / `_reply_read` expose `media_id` only. Enrich to include:

- `media_url` — `MediaAsset.secure_url` when `media_id` resolves; else `null`

Same for replies. No new endpoints.

### 3.2 Seed chat (and optional post media)

If catalog events have zero `ChatMessage` rows, seed a few host/guest messages for demo events (e.g. neon-night) so Chat isn’t empty on first open.

Optional: attach `media_id` to seeded posts only when Cloudinary assets exist; gallery fallback covers the common case without requiring Cloudinary for Community images.

### 3.3 Unchanged

- `GET/POST` posts and messages contracts stay; clients already auth-gated for write/list messages.
- No WebSocket routes.

---

## 4. Frontend architecture

```
Event detail (live)
  ├─ CommunityTab
  │    GET /events/{key}/posts → adaptCommunityPosts(items, galleryUrls)
  │    if items empty → synthesizeGalleryThread(galleryUrls, ev)
  └─ ChatTab (auth)
       GET /events/{key}/messages (initial + poll 2.5s)
       POST /events/{id}/messages on send
```

### 4.1 API modules

- `api/feed.js` — `listPosts(key)`, `listMessages(key)`, `sendMessage(eventId, text)` (+ createPost later if needed)
- Adapters: `adaptCommunityPost`, `adaptChatMessage` → existing UI field names (`media`, `avatarBg`, `mine`, etc.)

### 4.2 Gallery URL sources (priority)

1. Live event `photos[]` from `EventRead` when they are usable URLs  
2. Else `getCommunityPhotos(ev)` / banner assets keyed by `ev.key` (existing static `/events/...` paths)

### 4.3 Community adapter rules

- Map API author → `name`, `initials`, `avatarBg` from author color  
- `media` = `media_url` OR next unused gallery URL  
- Preserve phase labels / reply UI  
- Loading spinner; empty only if API empty **and** gallery empty; error + retry on fetch failure

### 4.4 Chat polling hook

`useEventChat({ eventKey, eventId, enabled })`:

- `enabled` = Chat tab active && authenticated && event loaded  
- Initial fetch; then `setInterval` 2500ms; clear on unmount / disable / `document.hidden`  
- `send(text)` → POST; optimistic append; toast on error; next poll reconciles by `id`  
- Guests: existing join gate; no fetch/poll

### 4.5 Screens

- `EventDetailLive.jsx` — replace `buildCommunityThread` / `buildChatSeed`  
- `DesktopEventDetail.jsx` — same  
- Upcoming detail: out of scope unless it already shows the same tabs with the same mock (if it does, apply the same wiring)

---

## 5. UX cross-cuts

- Loading: skeleton or short “Loading…” in tab body  
- Empty chat: “No messages yet — say hello”  
- Error: toast on send; inline retry on list failure  
- Identity: unchanged join gate for chat  

---

## 6. Testing

- Backend: unit/API test that post read includes `media_url` when media linked (mock media row)  
- Frontend: adapter pure tests for gallery fill + empty→synthesize  
- Manual: open live event → Community shows images; sign in → Chat loads, send message, second browser/session sees it within ~3s via poll  

---

## 7. Success criteria

- Live Community tab shows event-related images for seeded/catalog events (API posts and/or gallery fallback).  
- Chat uses live messages API; no static `buildChatSeed` on live detail.  
- Polling keeps chat updated while tab open; paused when hidden.  
- Mobile and desktop both wired.  
- No WebSocket dependency.

---

## 8. Out of scope

- WebSockets / SSE  
- Chat attachments, reactions UI beyond displaying API `reaction` if present  
- Full Cloudinary-backed community upload from guest UI (SE updates may already post text)  
- Redesign of Community/Chat layouts  
