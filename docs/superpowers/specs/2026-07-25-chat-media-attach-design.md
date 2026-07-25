# Event Chat Media Attach — Design

**Date:** 2026-07-25  
**Status:** Approved — ready for implementation plan  
**Depends on:** Existing feed chat (`/events/{key}/messages`), Cloudinary media APIs (`/media/sign`, `/media`), live event Chat UI (mobile + desktop)

---

## 1. Objective

Make the existing Chat **+** / camera controls functional: authenticated users pick a photo or video from their device, it uploads via Cloudinary, and the message persists so others see it through the existing 2.5s poll.

Keep current Chat chrome; do not redesign the input bar or add preview chips.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Surface | Event live chat only (mobile `EventDetailLive` + desktop `DesktopEventDetail`) |
| Persistence | Cloudinary upload + `media_assets` row + `chat_messages.media_id` |
| Caption | Optional — media-only messages allowed |
| UI | Keep existing + / camera / text / send; no new attach preview UI |
| Pick → send | On file chosen: upload then POST message immediately (include current input text if any, then clear input) |
| Guests | Unchanged identity gate before chat/attach |
| Multi-file | One file per message |
| Limits | Existing media service: images ≤10MB; videos ≤100MB; formats as today |

Prior chat design marked attachments out of scope; this spec supersedes that for chat media only.

---

## 3. Backend

### 3.1 Schema

- Alembic migration: add nullable `media_id Integer` to `chat_messages` (same pattern as `posts.media_id` — integer reference to `media_assets`, no DB FK required).
- SQLAlchemy `ChatMessage.media_id: Mapped[int | None]`.

### 3.2 API contract

`MessageCreateRequest`:

- `text: str | None = None`
- `media_id: int | None = None`
- Validation: at least one of `text` (non-empty after trim) or `media_id` required; else 400.

`POST /events/{event_id}/messages` passes `media_id` into `create_message`.

`_message_read` adds:

- `media_id`
- `media_url` — `MediaAsset.secure_url` when resolvable, else `null`
- `media_resource_type` — `image` | `video` from the asset when resolvable, else `null` (client uses this for `<img>` vs `<video>`)

Extend `_media_url` (or a sibling helper) to also return resource type when enriching message reads.

### 3.3 Unchanged

- `POST /media/sign`, `POST /media`, size/format validation
- Auth on list/send messages
- Polling model (no WebSockets)

---

## 4. Frontend

### 4.1 Upload helper

New small module (e.g. `api/uploadDeviceMedia.js`):

1. Infer `resourceType` from `file.type` (`video/*` → `video`, else `image`)
2. `signUpload({ folder: 'chat', resourceType })`
3. `FormData` POST to Cloudinary upload URL with signed params + file
4. `createMediaAsset({ ...cloudinary fields, entity_type: 'chat', entity_id: eventId })`
5. Return created asset `{ id, secure_url, resource_type }`

Client-side reject clearly if type/size outside known limits (toast); server remains source of truth.

### 4.2 Chat API / hook

- `sendMessage(eventId, { text, mediaId })` — body omits nulls
- `useEventChat.send({ text, mediaId, localPreviewUrl?, mediaType? })`:
  - Optimistic append with text + local object URL when present
  - On failure: remove optimistic row, toast, revoke object URL
  - Next poll replaces with server ids/URLs
- `adaptChatMessage`: map `media_url` → `media`, `media_resource_type` → `mediaType`

### 4.3 UI wiring (minimal)

- Hidden `<input type="file" accept="image/*,video/*">` next to existing + / camera (both trigger the same input)
- `onChange`: if not authed → identity gate; else upload + `send` (media-only or with current input text), disable controls while `pending`
- Text Send button stays text-only (unchanged); media goes out via the file picker path
- Message bubbles: if `media`, render `<img>` or `<video controls playsInline>` with existing text when present; media-only bubbles allowed
- Remove “Photo sharing is coming soon” toast for authed attach

No redesign of layout, colors, or bottom nav.

### 4.4 Screens

- `EventDetailLive.jsx` (mobile)
- `DesktopEventDetail.jsx` (desktop ChatTab)

---

## 5. Error handling

| Case | Behavior |
|------|----------|
| Guest taps + | Existing join / identity gate |
| Unsupported type / too large | Toast; no upload |
| Sign / Cloudinary / createMedia fail | Toast; no chat POST |
| Chat POST fail after media created | Toast; orphan media acceptable for v1 (no delete sweep) |
| Empty text and no file on Send | No-op (unchanged) |

---

## 6. Testing

- Backend API: create message with `media_id` → list includes `media_url` (+ resource type); reject empty body; text-only still works
- Frontend unit: `adaptChatMessage` maps media fields; upload helper can be tested with mocked `fetch` / API if practical
- Manual: SE signed in → live event Chat → + → pick image → appears in bubble → second session/poll sees it; same for a short video; guest still gated

---

## 7. Success criteria

- Authenticated SE (or any authed chat member) can attach image or video from device in live event chat.
- Message persists; other clients see media via existing poll.
- Caption optional (media-only OK).
- Existing Chat UI structure retained aside from bubble media render + hidden file input.
- Guests still cannot upload without identity.

---

## 8. Out of scope

- Preview chip / caption composer redesign
- Multi-attach, compression, HEIC client conversion beyond what Cloudinary accepts
- Moderation / flagging of chat media
- Community tab uploads, create-event gallery, live dashboard “Add photo”
- WebSockets, typing indicators, read receipts
- Automatic cleanup of orphaned `media_assets` after failed chat POST
