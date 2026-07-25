# Event Chat Media Attach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users attach a photo or video from their device in live event chat; persist via Cloudinary + `chat_messages.media_id` so others see it on poll.

**Architecture:** Extend `ChatMessage` with optional `media_id`; enrich message reads with `media_url` / `media_resource_type`. Frontend uploads with existing `/media/sign` → Cloudinary → `/media`, then `POST /messages` with optional caption. Wire existing + / camera to a hidden file input; render media inside existing chat bubbles. No Chat chrome redesign.

**Tech Stack:** FastAPI + Alembic + SQLAlchemy; Cloudinary signed upload; Vite/React; pytest; `node:test`.

**Spec:** `docs/superpowers/specs/2026-07-25-chat-media-attach-design.md`

## Global Constraints

- Branch: **`thread-test` only** (no new branch).
- Keep existing Chat UI; no preview chip / composer redesign.
- Caption optional; media-only messages allowed.
- One file per message; pick → upload → POST immediately.
- Guests still hit identity gate.
- Limits: images ≤10MB; videos ≤100MB; formats per `media_service`.
- Stage task-scoped files; commit per task.

## File structure

| Path | Responsibility |
|------|----------------|
| `backend/alembic/versions/0012_chat_message_media.py` | Add `chat_messages.media_id` |
| `backend/app/models/post.py` | `ChatMessage.media_id` column |
| `backend/app/schemas/feed.py` | Optional `text` + `media_id` on create |
| `backend/app/services/feed_service.py` | Validate, store, enrich reads |
| `backend/app/api/v1/feed.py` | Pass `media_id` into service |
| `backend/tests/test_feed_api.py` | Chat media + empty-body tests |
| `charity-app/src/api/feed.js` | `sendMessage(eventId, { text, mediaId })` |
| `charity-app/src/api/uploadDeviceMedia.js` | Sign → Cloudinary → createMediaAsset |
| `charity-app/src/api/uploadDeviceMedia.test.js` | Unit tests with mocked fetch/API |
| `charity-app/src/api/adapters/feed.js` | Map media fields on chat messages |
| `charity-app/src/api/adapters/feed.test.js` | Adapter asserts for chat media |
| `charity-app/src/hooks/useEventChat.js` | Send with media + optimistic preview |
| `charity-app/src/utils/chatMediaAttach.js` | Keep gate vs attach helper (already present) |
| `EventDetailLive.jsx` / `DesktopEventDetail.jsx` | File input + bubble media render |

---

### Task 1: Backend — `chat_messages.media_id` migration + model

**Files:**
- Create: `backend/alembic/versions/0012_chat_message_media.py`
- Modify: `backend/app/models/post.py` (`ChatMessage`)

**Interfaces:**
- Produces: `ChatMessage.media_id: int | None`

- [x] **Step 1: Add model field**

In `ChatMessage` (after `text` or near other optional ints):

```python
media_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
```

- [ ] **Step 2: Create migration**

```python
"""chat_messages.media_id

Revision ID: 0012_chat_message_media
Revises: 0011_nonprofit_import_fields
Create Date: 2026-07-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0012_chat_message_media"
down_revision = "0011_nonprofit_import_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chat_messages", sa.Column("media_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("chat_messages", "media_id")
```

- [ ] **Step 3: Apply migration**

Run: `cd backend && .venv\Scripts\python -m alembic upgrade head`  
Expected: upgrades to `0012_chat_message_media` with no error.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/0012_chat_message_media.py backend/app/models/post.py
git commit -m "feat(db): add media_id to chat_messages"
```

---

### Task 2: Backend — message create/read with media

**Files:**
- Modify: `backend/app/schemas/feed.py`
- Modify: `backend/app/services/feed_service.py`
- Modify: `backend/app/api/v1/feed.py`
- Modify: `backend/tests/test_feed_api.py`

**Interfaces:**
- Consumes: `ChatMessage.media_id`
- Produces:
  - `MessageCreateRequest(text: str | None = None, media_id: int | None = None)`
  - `send_message(..., text, media_id) -> dict` with `media_id`, `media_url`, `media_resource_type`
  - Reject when both text empty and `media_id` missing → `AppError` 400

- [ ] **Step 1: Write failing API tests**

Append to `backend/tests/test_feed_api.py`:

```python
@pytest.mark.asyncio
async def test_chat_message_with_media(client):
    headers = await _login(client, "fchatmedia@e.com", "se")
    ev = await _event(client, headers)
    media = await _create_media(client, headers, public_id="charity/chat1")

    sent = await client.post(
        f"/api/v1/events/{ev['id']}/messages",
        headers=headers,
        json={"media_id": media["id"]},
    )
    assert sent.status_code == 201
    body = sent.json()
    assert body["media_id"] == media["id"]
    assert body["media_url"] == media["secure_url"]
    assert body["media_resource_type"] == "image"
    assert body.get("text") in (None, "")

    msgs = await client.get(f"/api/v1/events/{ev['key']}/messages", headers=headers)
    item = msgs.json()["items"][0]
    assert item["media_url"] == media["secure_url"]
    assert item["media_resource_type"] == "image"


@pytest.mark.asyncio
async def test_chat_message_rejects_empty(client):
    headers = await _login(client, "fchatempty@e.com", "se")
    ev = await _event(client, headers)
    resp = await client.post(
        f"/api/v1/events/{ev['id']}/messages",
        headers=headers,
        json={},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_chat_message_text_and_media(client):
    headers = await _login(client, "fchatboth@e.com", "se")
    ev = await _event(client, headers)
    media = await _create_media(client, headers, public_id="charity/chat2")
    sent = await client.post(
        f"/api/v1/events/{ev['id']}/messages",
        headers=headers,
        json={"text": "check this out", "media_id": media["id"]},
    )
    assert sent.status_code == 201
    assert sent.json()["text"] == "check this out"
    assert sent.json()["media_url"] == media["secure_url"]
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd backend && .venv\Scripts\python -m pytest tests/test_feed_api.py::test_chat_message_with_media tests/test_feed_api.py::test_chat_message_rejects_empty tests/test_feed_api.py::test_chat_message_text_and_media -v`  
Expected: FAIL (schema still requires `text` / no media fields on read).

- [ ] **Step 3: Update schema**

```python
# backend/app/schemas/feed.py
class MessageCreateRequest(BaseModel):
    text: str | None = None
    media_id: int | None = None
```

- [ ] **Step 4: Enrich service + API**

```python
# feed_service.py — helpers
async def _media_meta(db: AsyncSession, media_id: int | None) -> tuple[str | None, str | None]:
    if not media_id:
        return None, None
    m = await media_repository.get_by_id(db, media_id)
    if not m:
        return None, None
    return m.secure_url, m.resource_type


def _message_read(msg: ChatMessage, author: dict | None, *, media_url=None, media_resource_type=None) -> dict:
    return {
        "id": msg.id,
        "text": msg.text,
        "reaction": msg.reaction,
        "host": msg.host,
        "verified": msg.verified,
        "created_at": msg.created_at.isoformat(),
        "author": author,
        "media_id": msg.media_id,
        "media_url": media_url,
        "media_resource_type": media_resource_type,
    }


async def list_messages(...):
    ...
    for m in messages:
        url, rtype = await _media_meta(db, m.media_id)
        out.append(_message_read(m, await _author_brief(db, m.user_id), media_url=url, media_resource_type=rtype))
    ...


async def send_message(db, user, event_id, text: str | None, media_id: int | None = None) -> dict:
    trimmed = (text or "").strip() or None
    if not trimmed and not media_id:
        raise AppError("validation_error", "Message requires text or media", status_code=400)
    event = await _event_or_404(db, event_id=event_id)
    msg = await frepo.create_message(
        db, event_id=event_id, user_id=user.id, text=trimmed, media_id=media_id,
        host=(event.organizer_id == user.id),
        verified=user.role in ("np_admin", "platform_admin"),
    )
    await event_repository.update(db, event, chat_count=event.chat_count + 1)
    url, rtype = await _media_meta(db, msg.media_id)
    return _message_read(msg, await _author_brief(db, user.id), media_url=url, media_resource_type=rtype)
```

Keep `_media_url` for posts if still used, or have `_media_url` call `_media_meta` and return only URL — do not break post tests.

```python
# feed.py send_message handler
return await feed_service.send_message(
    db, user, event_id, payload.text, payload.media_id
)
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd backend && .venv\Scripts\python -m pytest tests/test_feed_api.py -q`  
Expected: all PASS (including existing text-only chat test).

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/feed.py backend/app/services/feed_service.py backend/app/api/v1/feed.py backend/tests/test_feed_api.py
git commit -m "feat(api): support optional media on chat messages"
```

---

### Task 3: Frontend — adapter + `sendMessage` API

**Files:**
- Modify: `charity-app/src/api/feed.js`
- Modify: `charity-app/src/api/adapters/feed.js`
- Modify: `charity-app/src/api/adapters/feed.test.js`

**Interfaces:**
- Consumes: API message shape with `media_url`, `media_resource_type`
- Produces:
  - `sendMessage(eventId, { text, mediaId })`
  - `adaptChatMessage` → `{ media, mediaType, text, ... }`

- [ ] **Step 1: Failing adapter tests**

Add to `feed.test.js`:

```javascript
import { adaptChatMessage } from './feed.js';

describe('adaptChatMessage media', () => {
  it('maps media_url and media_resource_type', () => {
    const m = adaptChatMessage({
      id: 1,
      text: 'hi',
      media_url: 'https://cdn.example.com/a.jpg',
      media_resource_type: 'image',
      author: { id: 9, name: 'Ada', initials: 'A' },
    }, 9);
    assert.equal(m.media, 'https://cdn.example.com/a.jpg');
    assert.equal(m.mediaType, 'image');
    assert.equal(m.mine, true);
  });

  it('allows media-only messages', () => {
    const m = adaptChatMessage({
      id: 2,
      text: null,
      media_url: 'https://cdn.example.com/v.mp4',
      media_resource_type: 'video',
      author: { id: 1, name: 'Bob', initials: 'B' },
    }, 99);
    assert.equal(m.text, null);
    assert.equal(m.mediaType, 'video');
    assert.equal(m.mine, false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd charity-app && node --test src/api/adapters/feed.test.js`  
Expected: FAIL (no `media` / `mediaType` yet).

- [ ] **Step 3: Implement adapter + API**

```javascript
// adaptChatMessage
export function adaptChatMessage(m, currentUserId) {
  const author = m.author || {};
  const mine = currentUserId != null && author.id === currentUserId;
  return {
    id: m.id,
    name: author.name,
    initials: mine ? 'ME' : (author.initials || '?'),
    avatar: avatarBg(author),
    host: !!m.host,
    verified: !!m.verified,
    text: m.text,
    media: m.media_url || null,
    mediaType: m.media_resource_type || null,
    reaction: m.reaction,
    mine,
    sent: mine ? 'Sent' : undefined,
  };
}
```

```javascript
// feed.js
export function sendMessage(eventId, { text, mediaId } = {}) {
  const body = {};
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed) body.text = trimmed;
  if (mediaId != null) body.media_id = mediaId;
  return apiRequest(`/events/${eventId}/messages`, { method: 'POST', body });
}
```

Update any call sites that still pass a bare string — `useEventChat` will be updated in Task 5; temporarily keep backward compat if needed:

```javascript
export function sendMessage(eventId, textOrOpts) {
  if (typeof textOrOpts === 'string') {
    return sendMessage(eventId, { text: textOrOpts });
  }
  // ... as above
}
```

Prefer a single object form and update the one caller in Task 5 in the same change set if committing together is awkward — for this task, implement object form and adjust `useEventChat` import usage in Task 5 only if tests don’t import send yet. If `useEventChat` breaks the app mid-plan, update its call to `{ text: trimmed }` in this task’s Step 3.

- [ ] **Step 4: Run adapter tests — PASS**

Run: `cd charity-app && node --test src/api/adapters/feed.test.js`

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/api/feed.js charity-app/src/api/adapters/feed.js charity-app/src/api/adapters/feed.test.js
git commit -m "feat(app): map chat message media in API and adapters"
```

---

### Task 4: Frontend — `uploadDeviceMedia` helper

**Files:**
- Create: `charity-app/src/api/uploadDeviceMedia.js`
- Create: `charity-app/src/api/uploadDeviceMedia.test.js`
- Uses: `charity-app/src/api/media.js` (`signUpload`, `createMediaAsset`)

**Interfaces:**
- Produces: `uploadDeviceMedia(file, { folder?, eventId? }) -> Promise<{ id, secure_url, resource_type }>`
- Throws `Error` with message suitable for toast on client validation / network failure

- [ ] **Step 1: Write failing tests**

```javascript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Test pure validation via exported helpers if you split them:
import { inferResourceType, assertUploadableFile, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './uploadDeviceMedia.js';

describe('uploadDeviceMedia validation', () => {
  it('infers video vs image', () => {
    assert.equal(inferResourceType({ type: 'video/mp4' }), 'video');
    assert.equal(inferResourceType({ type: 'image/jpeg' }), 'image');
  });

  it('rejects oversized images', () => {
    assert.throws(
      () => assertUploadableFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1, name: 'x.png' }),
      /10MB/,
    );
  });

  it('rejects unsupported types', () => {
    assert.throws(
      () => assertUploadableFile({ type: 'application/pdf', size: 100, name: 'x.pdf' }),
      /Unsupported/,
    );
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing)

Run: `cd charity-app && node --test src/api/uploadDeviceMedia.test.js`

- [ ] **Step 3: Implement**

```javascript
import { signUpload, createMediaAsset } from './media.js';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const IMAGE_MIME = /^image\/(jpeg|jpg|png|webp|gif|heic)$/i;
const VIDEO_MIME = /^video\/(mp4|quicktime|webm)$/i; // quicktime = mov

export function inferResourceType(file) {
  return String(file?.type || '').startsWith('video/') ? 'video' : 'image';
}

export function assertUploadableFile(file) {
  if (!file) throw new Error('No file selected');
  const type = file.type || '';
  const isVideo = VIDEO_MIME.test(type) || type === 'video/mov';
  const isImage = IMAGE_MIME.test(type) || /^image\//i.test(type);
  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error('Video exceeds 100MB limit');
    return 'video';
  }
  if (isImage) {
    // Allow common image/*; server validates format strictly after upload
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image exceeds 10MB limit');
    return 'image';
  }
  throw new Error('Unsupported file type');
}

export async function uploadDeviceMedia(file, { folder = 'chat', eventId = null } = {}) {
  const resourceType = assertUploadableFile(file);
  const sign = await signUpload({ folder, resourceType });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sign.api_key);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);

  const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/${resourceType}/upload`;
  const cloudRes = await fetch(cloudUrl, { method: 'POST', body: form });
  if (!cloudRes.ok) {
    const detail = await cloudRes.text().catch(() => '');
    throw new Error(detail || 'Cloudinary upload failed');
  }
  const uploaded = await cloudRes.json();

  return createMediaAsset({
    public_id: uploaded.public_id,
    secure_url: uploaded.secure_url,
    resource_type: uploaded.resource_type || resourceType,
    format: uploaded.format,
    bytes: uploaded.bytes,
    width: uploaded.width ?? null,
    height: uploaded.height ?? null,
    entity_type: 'chat',
    entity_id: eventId,
  });
}
```

- [ ] **Step 4: Run validation tests — PASS**

Run: `cd charity-app && node --test src/api/uploadDeviceMedia.test.js`

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/api/uploadDeviceMedia.js charity-app/src/api/uploadDeviceMedia.test.js
git commit -m "feat(app): add device media upload helper for chat"
```

---

### Task 5: Frontend — `useEventChat` send with media

**Files:**
- Modify: `charity-app/src/hooks/useEventChat.js`

**Interfaces:**
- Consumes: `sendMessage(eventId, { text, mediaId })`, `adaptChatMessage`
- Produces: `send({ text, mediaId, localPreviewUrl, mediaType })`

- [ ] **Step 1: Replace `send` implementation**

```javascript
const send = useCallback(async ({ text, mediaId, localPreviewUrl, mediaType } = {}) => {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!eventId || pending) return;
  if (!trimmed && mediaId == null && !localPreviewUrl) return;

  const optimisticId = `pending-${Date.now()}`;
  setPending(true);
  setMessages((prev) => [
    ...prev,
    {
      id: optimisticId,
      mine: true,
      initials: 'ME',
      avatar: 'linear-gradient(135deg,#7B1FA2,#AB47BC)',
      text: trimmed || null,
      media: localPreviewUrl || null,
      mediaType: mediaType || null,
      sent: 'Sending…',
    },
  ]);

  try {
    await sendMessage(eventId, {
      text: trimmed || undefined,
      mediaId: mediaId ?? undefined,
    });
    // next poll reconciles; drop optimistic row so we don't duplicate
    setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
  } catch (err) {
    setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    showToast?.(err?.message || 'Could not send message');
    throw err;
  } finally {
    setPending(false);
  }
}, [eventId, pending, showToast]);
```

- [ ] **Step 2: Update call sites that pass a string**

In `EventDetailLive.jsx` / `DesktopEventDetail.jsx` (Task 6 will finish attach; for compile safety now):

```javascript
await sendChatMessage({ text });
```

- [ ] **Step 3: Smoke-check hook loads** — open app; text send still works on live chat.

- [ ] **Step 4: Commit**

```bash
git add charity-app/src/hooks/useEventChat.js charity-app/src/screens/guests/EventDetailLive.jsx charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx
git commit -m "feat(app): extend useEventChat send for media payloads"
```

---

### Task 6: Wire mobile + desktop Chat UI

**Files:**
- Modify: `charity-app/src/screens/guests/EventDetailLive.jsx`
- Modify: `charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx`
- Keep/use: `charity-app/src/utils/chatMediaAttach.js` for guest gate only if helpful; attach path uploads instead of toast

**Interfaces:**
- Consumes: `uploadDeviceMedia`, `useEventChat.send`, `handleChatMediaAttach` (gate only)

- [ ] **Step 1: Shared bubble media snippet**

In both message list renderers, replace bare text bubble with:

```jsx
<div className="chat-bubble">
  {m.media && m.mediaType === 'video' && (
    <video src={m.media} controls playsInline style={{ maxWidth: '100%', borderRadius: 8, display: 'block', marginBottom: m.text ? 8 : 0 }} />
  )}
  {m.media && m.mediaType !== 'video' && (
    <img src={m.media} alt="" style={{ maxWidth: '100%', borderRadius: 8, display: 'block', marginBottom: m.text ? 8 : 0 }} />
  )}
  {m.text ? m.text : null}
</div>
```

If `m.media` exists but `mediaType` is null, treat as image.

- [ ] **Step 2: Mobile — file input + attach handler**

In `EventDetailLive`:

- `useRef` for file input
- Hidden input: `accept="image/*,video/*"`
- `onAttach`: if `requireJoin()` return; else `fileInputRef.current?.click()`
- `onChange`:

```javascript
const file = e.target.files?.[0];
e.target.value = '';
if (!file || !ev?.id) return;
const caption = chatInput.trim();
const localPreviewUrl = URL.createObjectURL(file);
const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
try {
  const asset = await uploadDeviceMedia(file, { folder: 'chat', eventId: ev.id });
  await sendChatMessage({
    text: caption,
    mediaId: asset.id,
    localPreviewUrl,
    mediaType: asset.resource_type || mediaType,
  });
  setChatInput('');
} catch (err) {
  URL.revokeObjectURL(localPreviewUrl);
  showToast(err?.message || 'Could not upload media');
}
```

Pass `disabled={chatPending}` already on input bar; ensure attach ignored while pending.

- [ ] **Step 3: Desktop ChatTab — same pattern**

- Add file input ref inside `ChatTab` (has `loggedIn`, `showToast`, `send`)
- + / camera → if `!loggedIn` then `onNeedJoin()` else open picker
- `onChange` same upload + `send({...})` using current `value` then `setValue('')`
- Render media in desktop message bubbles like mobile

- [ ] **Step 4: Manual verify**

1. Sign in as SE (`mike.rivera@demo.charityhub.com` / `Passw0rd!` if seeded).
2. Open `/event/live/:key` → Chat.
3. Tap + → pick a small JPEG → message appears with image; refresh/other tab sees it after poll.
4. Pick a short mp4 → video controls render.
5. Guest `/guest/event/live/:key` → + still opens join gate.
6. Text-only send still works.

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/screens/guests/EventDetailLive.jsx charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx charity-app/src/utils/chatMediaAttach.js charity-app/src/utils/chatMediaAttach.test.js
git commit -m "feat(app): enable chat photo/video attach from device"
```

---

### Task 7: Regression sweep

**Files:** none required unless fixes

- [ ] **Step 1: Backend suite**

Run: `cd backend && .venv\Scripts\python -m pytest tests/test_feed_api.py tests/test_media_api.py -q`  
Expected: PASS

- [ ] **Step 2: Frontend unit tests**

Run: `cd charity-app && node --test src/api/adapters/feed.test.js src/api/uploadDeviceMedia.test.js src/utils/chatMediaAttach.test.js`  
Expected: PASS

- [ ] **Step 3: Fix any failures; commit if needed**

```bash
git commit -m "test: fix chat media attach regressions"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| `chat_messages.media_id` migration + model | 1 |
| Optional text + media_id; reject empty | 2 |
| `media_url` + `media_resource_type` on reads | 2 |
| Cloudinary upload helper | 4 |
| `sendMessage` + adapter mapping | 3 |
| `useEventChat` media send / optimistic | 5 |
| Hidden file input on + / camera; keep chrome | 6 |
| Bubble img/video render | 6 |
| Guest identity gate unchanged | 6 |
| Client size/type toast errors | 4 + 6 |
| Backend + adapter tests | 2, 3, 4, 7 |
| Out of scope: preview chip, multi-file, community upload | — not planned |

## Self-review notes

- No TBD/placeholder steps.
- `sendMessage` object form aligned across Tasks 3 and 5.
- Migration revises `0011_nonprofit_import_fields`.
- Orphan media after failed chat POST left as accepted v1 behavior per spec.
