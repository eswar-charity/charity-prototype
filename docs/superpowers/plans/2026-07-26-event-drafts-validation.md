# Event Draft Editing & Submit Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Default Step 3 dates to today, disable Next/Submit until checklist validation passes, and add a Drafts list (Feed + Profile) to reopen, edit, save, or submit drafts with last-step restore.

**Architecture:** Shared `eventDraftValidation` helpers gate wizard Next and Submit. Draft store gains `guidelinesReviewed` + `wizardStep`; create/save-draft persist `wizard_step`. New `GET /events/mine` powers `/event/drafts`. `beginEventDraft` hydrates Draft rows; `beginEventFix` stays for Changes Requested.

**Tech Stack:** FastAPI + Alembic + SQLAlchemy; React/Vite; pytest; `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-26-event-drafts-validation-design.md`

## Global Constraints

- Branch: **`thread-test` only** (no new branch).
- Date defaults apply only to **new** drafts (`resetDraft` / `freshDraft`); never overwrite hydrated drafts.
- Keep demo `startTime`, `endTime`, `location` defaults; only change `startDate` / `endDate`.
- Submit readiness = ≥1 photo, nonprofit, start date + location, guidelines ack (fix mode: allowed steps + guidelines).
- Save as draft stays ungated.
- `GET /events/mine` must be registered **before** `GET /events/{key}`.
- Stage task-scoped files; commit per task.

## File structure

| Path | Responsibility |
|------|----------------|
| `backend/alembic/versions/0013_event_wizard_step.py` | Add `events.wizard_step` |
| `backend/app/models/event.py` | `wizard_step` column |
| `backend/app/schemas/event.py` | `wizard_step` on read/create/update |
| `backend/app/repositories/event_repository.py` | Status filter on `list_by_organizer` |
| `backend/app/services/event_service.py` | Persist/read `wizard_step`; `list_mine` |
| `backend/app/api/v1/events.py` | `GET /events/mine` before `/{key}` |
| `backend/tests/test_event_api.py` | Mine + wizard_step round-trip |
| `charity-app/src/hooks/useCreateEventDraft.js` | Today dates; `guidelinesReviewed`; `wizardStep` |
| `charity-app/src/utils/eventDraftValidation.js` | `isStepComplete` / `isDraftReadyToSubmit` |
| `charity-app/src/utils/eventDraftValidation.test.js` | Unit tests |
| `charity-app/src/utils/beginEventDraft.js` | Hydrate draft (non-fix) |
| `charity-app/src/utils/beginEventDraft.test.js` | Mapping tests |
| `charity-app/src/utils/eventDraftPayload.js` | Include `wizard_step` |
| `charity-app/src/api/events.js` | `listMyEvents` |
| `charity-app/src/components/SubmitChecklist.jsx` | Use helpers; write `guidelinesReviewed` to store |
| `charity-app/src/screens/EventStep{1,2,3,4}.jsx` + desktop | Gate Next/Submit; set `wizardStep` |
| `charity-app/src/hooks/useEventWizardMutations.js` | Pass `wizardStep` on persist |
| `charity-app/src/screens/EventDrafts.jsx` + desktop | Drafts list UI |
| `charity-app/src/App.jsx` | `/event/drafts` route |
| Feed + Profile screens | Links into drafts |

---

### Task 1: Backend — `wizard_step` migration + model

**Files:**
- Create: `backend/alembic/versions/0013_event_wizard_step.py`
- Modify: `backend/app/models/event.py`

**Interfaces:**
- Produces: `Event.wizard_step: Mapped[int | None]`

- [ ] **Step 1: Add model field**

After `location` (or near other optional logistics fields) on `Event`:

```python
wizard_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
```

- [ ] **Step 2: Create migration**

```python
"""events.wizard_step

Revision ID: 0013_event_wizard_step
Revises: 0012_chat_message_media
Create Date: 2026-07-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0013_event_wizard_step"
down_revision = "0012_chat_message_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("wizard_step", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "wizard_step")
```

- [ ] **Step 3: Apply migration**

Run: `cd backend; .venv\Scripts\python -m alembic upgrade head`  
Expected: upgrades to `0013_event_wizard_step` with no error.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/0013_event_wizard_step.py backend/app/models/event.py
git commit -m "feat(db): add wizard_step to events"
```

---

### Task 2: Backend — schemas + create/update + EventRead

**Files:**
- Modify: `backend/app/schemas/event.py`
- Modify: `backend/app/services/event_service.py` (`_to_read`, `create_draft`, `update_draft`)
- Modify: `backend/app/repositories/event_repository.py` only if `create`/`update` need no changes (kwargs already pass through)

**Interfaces:**
- Consumes: `Event.wizard_step`
- Produces: `wizard_step` on `EventRead` / create / update payloads; persisted on create/update

- [ ] **Step 1: Extend schemas**

On `EventRead` add:

```python
wizard_step: int | None = None
```

On `EventCreateRequest` and `EventUpdateRequest` add:

```python
wizard_step: int | None = None
```

- [ ] **Step 2: Include in `_to_read`**

In the `data = { ... }` dict in `_to_read`, add:

```python
"wizard_step": event.wizard_step,
```

- [ ] **Step 3: Persist on create**

In `create_draft`, pass into `repo.create(...)`:

```python
wizard_step=data.get("wizard_step"),
```

- [ ] **Step 4: Persist on update**

`update_draft` already copies non-None fields from `data` into `fields` then `repo.update`. Ensure `wizard_step` is not stripped. If `model_dump()` includes `None` keys that are filtered by `if v is not None`, clients that omit the field leave the DB value unchanged — correct. When client sends `wizard_step: 3`, it updates.

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/event.py backend/app/services/event_service.py
git commit -m "feat(api): persist and return event wizard_step"
```

---

### Task 3: Backend — `GET /events/mine` + tests

**Files:**
- Modify: `backend/app/repositories/event_repository.py`
- Modify: `backend/app/services/event_service.py`
- Modify: `backend/app/api/v1/events.py`
- Modify: `backend/tests/test_event_api.py`

**Interfaces:**
- Consumes: `list_by_organizer` with optional statuses
- Produces: `GET /api/v1/events/mine?statuses=Draft,Changes%20Requested` → `EventListResponse`

- [ ] **Step 1: Extend repository**

Replace / extend `list_by_organizer`:

```python
async def list_by_organizer(
    db: AsyncSession,
    organizer_id: int,
    statuses: list[str] | None = None,
) -> list[Event]:
    stmt = select(Event).where(Event.organizer_id == organizer_id)
    if statuses:
        stmt = stmt.where(Event.status.in_(statuses))
    stmt = stmt.order_by(Event.id.desc())
    return list((await db.execute(stmt)).scalars().all())
```

- [ ] **Step 2: Add service `list_mine`**

```python
async def list_mine(
    db: AsyncSession,
    user: User,
    statuses: list[str] | None = None,
) -> dict:
    effective = statuses or ["Draft", "Changes Requested"]
    items = await repo.list_by_organizer(db, user.id, statuses=effective)
    return {
        "items": [await _to_read(db, e, include_photos=True) for e in items],
        "total": len(items),
        "has_more": False,
    }
```

- [ ] **Step 3: Add route BEFORE `GET /{key}`**

In `events.py`, after `create_event` and **before** `@router.get("/{key}")`:

```python
@router.get("/mine", response_model=EventListResponse)
async def list_my_events(
    statuses: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parsed = None
    if statuses:
        parsed = [s.strip() for s in statuses.split(",") if s.strip()]
    return await event_service.list_mine(db, user, parsed)
```

- [ ] **Step 4: Write failing/passing API tests**

Append to `backend/tests/test_event_api.py`:

```python
@pytest.mark.asyncio
async def test_list_mine_drafts_and_wizard_step(client, db_session):
    from app.repositories import nonprofit_repository as np_repo

    np = await np_repo.create(
        db_session, name="Mine NP", slug="mine-np", category="Community"
    )
    headers = await _login(client, "mine.se@demo.charityhub.com")
    create = await client.post(
        "/api/v1/events",
        headers=headers,
        json={
            "story": "Park cleanup day",
            "nonprofit_id": np.id,
            "date": "Jul 26, 2026",
            "location": "Central Park",
            "wizard_step": 3,
        },
    )
    assert create.status_code == 201
    body = create.json()
    assert body["wizard_step"] == 3
    assert body["status"] == "Draft"
    event_id = body["id"]

    save = await client.post(
        f"/api/v1/events/{event_id}/save-draft",
        headers=headers,
        json={"wizard_step": 4, "story": "Park cleanup day"},
    )
    assert save.status_code == 200
    assert save.json()["wizard_step"] == 4

    mine = await client.get("/api/v1/events/mine", headers=headers)
    assert mine.status_code == 200
    items = mine.json()["items"]
    assert any(i["id"] == event_id and i["wizard_step"] == 4 for i in items)

    filtered = await client.get(
        "/api/v1/events/mine",
        headers=headers,
        params={"statuses": "Draft"},
    )
    assert filtered.status_code == 200
    assert all(i["status"] == "Draft" for i in filtered.json()["items"])
```

- [ ] **Step 5: Run tests**

Run: `cd backend; .venv\Scripts\python -m pytest tests/test_event_api.py::test_list_mine_drafts_and_wizard_step -v`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/repositories/event_repository.py backend/app/services/event_service.py backend/app/api/v1/events.py backend/tests/test_event_api.py
git commit -m "feat(api): list organizer draft events via /events/mine"
```

---

### Task 4: Frontend — draft store date defaults + new fields

**Files:**
- Modify: `charity-app/src/hooks/useCreateEventDraft.js`
- Create: `charity-app/src/hooks/useCreateEventDraft.test.js` (optional small test via importing `formatDisplayDate` expectations — if hook store is hard to test, test date via a tiny exported `buildDefaultDraft()` helper)

**Interfaces:**
- Produces: `DEFAULT_DRAFT` / `freshDraft()` with today dates, `guidelinesReviewed: false`, `wizardStep: 1`

- [ ] **Step 1: Prefer exporting a builder for testability**

In `useCreateEventDraft.js`:

```javascript
import { formatDisplayDate } from '../utils/datePicker';

export function buildDefaultDraft() {
  const today = formatDisplayDate(new Date());
  return {
    serverEventId: null,
    serverKey: null,
    coverMediaId: null,
    title: '',
    photos: [],
    story: '',
    nonprofitId: null,
    category: null,
    startDate: today,
    endDate: today,
    startTime: '9:00 AM',
    endTime: '9:00 PM',
    location: 'Central Park, New York NY',
    visibility: 'public',
    previewLiked: false,
    inviteSent: false,
    fixMode: false,
    allowedSteps: null,
    changeFeedback: '',
    guidelinesReviewed: false,
    wizardStep: 1,
  };
}

function freshDraft() {
  return { ...buildDefaultDraft(), photos: [] };
}
```

Remove the old `DEFAULT_DRAFT` constant with hardcoded `Oct 14, 2025`.

- [ ] **Step 2: Write test**

`charity-app/src/hooks/useCreateEventDraft.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultDraft } from './useCreateEventDraft.js';
import { formatDisplayDate } from '../utils/datePicker.js';

describe('buildDefaultDraft', () => {
  it('defaults start and end date to today', () => {
    const draft = buildDefaultDraft();
    const today = formatDisplayDate(new Date());
    assert.equal(draft.startDate, today);
    assert.equal(draft.endDate, today);
  });

  it('starts guidelinesReviewed false and wizardStep 1', () => {
    const draft = buildDefaultDraft();
    assert.equal(draft.guidelinesReviewed, false);
    assert.equal(draft.wizardStep, 1);
  });
});
```

- [ ] **Step 3: Run test**

Run: `cd charity-app; node --test src/hooks/useCreateEventDraft.test.js`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add charity-app/src/hooks/useCreateEventDraft.js charity-app/src/hooks/useCreateEventDraft.test.js
git commit -m "feat(app): default event draft dates to today"
```

---

### Task 5: Frontend — validation helpers

**Files:**
- Create: `charity-app/src/utils/eventDraftValidation.js`
- Create: `charity-app/src/utils/eventDraftValidation.test.js`

**Interfaces:**
- Produces:
  - `isStepComplete(step, draft, nonprofit?) => boolean`
  - `isDraftReadyToSubmit(draft, nonprofit, { fixMode, allowedSteps } = {}) => boolean`

- [ ] **Step 1: Write failing tests**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isStepComplete, isDraftReadyToSubmit } from './eventDraftValidation.js';

const empty = {
  photos: [],
  nonprofitId: null,
  startDate: '',
  location: '',
  guidelinesReviewed: false,
  fixMode: false,
  allowedSteps: null,
};

describe('isStepComplete', () => {
  it('step 1 requires photos', () => {
    assert.equal(isStepComplete(1, empty), false);
    assert.equal(isStepComplete(1, { ...empty, photos: [{ id: 1 }] }), true);
  });

  it('step 2 requires nonprofit', () => {
    assert.equal(isStepComplete(2, empty, null), false);
    assert.equal(isStepComplete(2, { ...empty, nonprofitId: 9 }, { id: 9 }), true);
  });

  it('step 3 requires startDate and location', () => {
    assert.equal(isStepComplete(3, { ...empty, startDate: 'Jul 26, 2026' }), false);
    assert.equal(
      isStepComplete(3, { ...empty, startDate: 'Jul 26, 2026', location: 'Park' }),
      true,
    );
  });
});

describe('isDraftReadyToSubmit', () => {
  const ready = {
    photos: [{ id: 1 }],
    nonprofitId: 1,
    startDate: 'Jul 26, 2026',
    location: 'Park',
    guidelinesReviewed: true,
    fixMode: false,
    allowedSteps: null,
  };

  it('requires all steps and guidelines', () => {
    assert.equal(isDraftReadyToSubmit(ready, { id: 1 }), true);
    assert.equal(isDraftReadyToSubmit({ ...ready, guidelinesReviewed: false }, { id: 1 }), false);
    assert.equal(isDraftReadyToSubmit({ ...ready, photos: [] }, { id: 1 }), false);
  });

  it('in fix mode only checks allowed steps + guidelines', () => {
    const draft = {
      ...ready,
      photos: [],
      fixMode: true,
      allowedSteps: [3, 4],
      guidelinesReviewed: true,
    };
    assert.equal(isDraftReadyToSubmit(draft, { id: 1 }), true);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd charity-app; node --test src/utils/eventDraftValidation.test.js`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement**

```javascript
import { isStepAllowed } from './changeRequestAreas.js';

export function isStepComplete(step, draft, nonprofit) {
  if (step === 1) return (draft.photos?.length ?? 0) > 0;
  if (step === 2) return Boolean(nonprofit) || draft.nonprofitId != null;
  if (step === 3) {
    return Boolean(draft.startDate?.trim()) && Boolean(draft.location?.trim());
  }
  return true;
}

export function isDraftReadyToSubmit(draft, nonprofit, options = {}) {
  const fixMode = options.fixMode ?? !!draft.fixMode;
  const allowedSteps = options.allowedSteps ?? draft.allowedSteps;
  if (!draft.guidelinesReviewed) return false;

  const stepsToCheck = fixMode && allowedSteps
    ? [1, 2, 3].filter((s) => isStepAllowed(allowedSteps, s))
    : [1, 2, 3];

  return stepsToCheck.every((s) => isStepComplete(s, draft, nonprofit));
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd charity-app; node --test src/utils/eventDraftValidation.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/utils/eventDraftValidation.js charity-app/src/utils/eventDraftValidation.test.js
git commit -m "feat(app): add event draft step and submit validation helpers"
```

---

### Task 6: Frontend — wire Next / Submit gating + checklist store

**Files:**
- Modify: `charity-app/src/components/SubmitChecklist.jsx`
- Modify: `charity-app/src/screens/EventStep1.jsx`, `EventStep2.jsx`, `EventStep3.jsx`, `EventStep4.jsx`
- Modify: `charity-app/src/screens/desktop/DesktopEventStep1.jsx`, `DesktopEventStep2.jsx`, `DesktopEventStep3.jsx`, `DesktopEventStep4.jsx`

**Interfaces:**
- Consumes: `isStepComplete`, `isDraftReadyToSubmit`, `updateDraft({ guidelinesReviewed, wizardStep })`

- [ ] **Step 1: SubmitChecklist uses store for guidelines**

- Remove local `useState` for `guidelinesReviewed`; read `source.guidelinesReviewed`.
- On acknowledge: `updateDraft({ guidelinesReviewed: true })`.
- Use `isStepComplete` for done flags for steps 1–3 (keep display text as today).

- [ ] **Step 2: Gate mobile Next buttons**

Pattern for Step 1 (mirror on 2 and 3 with correct step number / nonprofit arg):

```javascript
import { isStepComplete } from '../utils/eventDraftValidation';
import { updateDraft } from '../hooks/useCreateEventDraft';
// ...
const canNext = isStepComplete(1, draft);
// ...
<button
  type="button"
  className="btn-primary"
  disabled={!canNext}
  onClick={() => {
    updateDraft({ wizardStep: 2 });
    navigate(nextWizardPath(fixMode, allowedSteps, 1));
  }}
>
```

Step 2: `isStepComplete(2, draft, /* selected nonprofit object or null */)`; set `wizardStep: 3`.  
Step 3: `isStepComplete(3, draft)`; set `wizardStep: 4`.

Use `useSelectedNonprofit(draft.nonprofitId)` on Step 2/4 where nonprofit object is needed.

- [ ] **Step 3: Gate Submit on Step 4 (mobile + desktop)**

```javascript
import { isDraftReadyToSubmit } from '../utils/eventDraftValidation';

const canSubmit = isDraftReadyToSubmit(draft, nonprofit);
// ...
<button
  type="button"
  className="btn-primary"
  onClick={handleSubmit}
  disabled={pending || !canSubmit}
>
```

- [ ] **Step 4: Mirror gating on all DesktopEventStep{1–4} Next/Submit buttons**

Same helpers; on Next also `updateDraft({ wizardStep: N })`.

- [ ] **Step 5: Manual sanity (optional)** — open wizard: Next disabled until photo; Submit disabled until checklist complete.

- [ ] **Step 6: Commit**

```bash
git add charity-app/src/components/SubmitChecklist.jsx charity-app/src/screens/EventStep1.jsx charity-app/src/screens/EventStep2.jsx charity-app/src/screens/EventStep3.jsx charity-app/src/screens/EventStep4.jsx charity-app/src/screens/desktop/DesktopEventStep1.jsx charity-app/src/screens/desktop/DesktopEventStep2.jsx charity-app/src/screens/desktop/DesktopEventStep3.jsx charity-app/src/screens/desktop/DesktopEventStep4.jsx
git commit -m "feat(app): gate event wizard Next and Submit on validation"
```

---

### Task 7: Frontend — persist `wizard_step` on save

**Files:**
- Modify: `charity-app/src/utils/eventDraftPayload.js`
- Modify: `charity-app/src/utils/eventDraftPayload.test.js`
- Modify: `charity-app/src/hooks/useEventWizardMutations.js`

**Interfaces:**
- Consumes: `draft.wizardStep`
- Produces: payload field `wizard_step`

- [ ] **Step 1: Map wizard_step in payload**

In `mapDraftToApiPayload`:

```javascript
  if (draft.wizardStep != null) {
    payload.wizard_step = Number(draft.wizardStep);
  }
```

- [ ] **Step 2: Update unit test**

In `maps snake_case API fields` test, either include `wizardStep: 2` on `baseDraft` and expect `wizard_step: 2`, or add a dedicated case:

```javascript
  it('includes wizard_step when wizardStep is set', () => {
    const payload = mapDraftToApiPayload({ ...baseDraft, wizardStep: 3 });
    assert.equal(payload.wizard_step, 3);
  });
```

- [ ] **Step 3: Ensure save path uses current step**

Before `ensurePersisted` in `handleSaveDraft`, if desired, leave `wizardStep` as last set by navigation. Optionally accept an optional `step` argument:

```javascript
const handleSaveDraft = useCallback(async (stepOverride) => {
  if (stepOverride != null) updateDraft({ wizardStep: stepOverride });
  // ... existing ensurePersisted
}, ...);
```

Desktop layout Save draft should pass current `step` prop: `handleSaveDraft(step)`.

- [ ] **Step 4: Run payload tests**

Run: `cd charity-app; node --test src/utils/eventDraftPayload.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/utils/eventDraftPayload.js charity-app/src/utils/eventDraftPayload.test.js charity-app/src/hooks/useEventWizardMutations.js charity-app/src/components/desktop/DesktopCreateEventLayout.jsx
git commit -m "feat(app): persist wizard_step when saving event drafts"
```

---

### Task 8: Frontend — `beginEventDraft` + `listMyEvents` API

**Files:**
- Create: `charity-app/src/utils/beginEventDraft.js`
- Create: `charity-app/src/utils/beginEventDraft.test.js`
- Modify: `charity-app/src/api/events.js`

**Interfaces:**
- Produces: `beginEventDraft(rawEvent) => { wizardStep: number }`
- Produces: `listMyEvents({ statuses }?) => EventListResponse`

- [ ] **Step 1: Implement `beginEventDraft`**

```javascript
import { updateDraft } from '../hooks/useCreateEventDraft';

export function beginEventDraft(rawEvent) {
  if (!rawEvent?.id) return null;

  const photos = (rawEvent.photos || []).map((src, i) => ({ id: i + 1, src }));
  const wizardStep = rawEvent.wizard_step >= 1 && rawEvent.wizard_step <= 4
    ? rawEvent.wizard_step
    : 1;

  updateDraft({
    serverEventId: rawEvent.id,
    serverKey: rawEvent.key,
    coverMediaId: rawEvent.cover_media_id ?? null,
    title: rawEvent.title || '',
    photos,
    story: rawEvent.story || '',
    nonprofitId: rawEvent.nonprofit?.id ?? null,
    category: rawEvent.category || rawEvent.nonprofit?.category || null,
    startDate: rawEvent.date || '',
    endDate: rawEvent.date || '',
    startTime: rawEvent.start_time || '',
    endTime: rawEvent.end_time || '',
    location: rawEvent.location || '',
    visibility: rawEvent.visibility || 'public',
    previewLiked: false,
    inviteSent: false,
    fixMode: false,
    allowedSteps: null,
    changeFeedback: '',
    guidelinesReviewed: false,
    wizardStep,
  });

  return { wizardStep };
}
```

- [ ] **Step 2: Unit test with a mock `updateDraft`**

Prefer testing pure mapping by exporting `mapEventToDraftPatch(rawEvent)` used by `beginEventDraft`, then:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapEventToDraftPatch } from './beginEventDraft.js';

describe('mapEventToDraftPatch', () => {
  it('maps fields and clears fix mode', () => {
    const patch = mapEventToDraftPatch({
      id: 10,
      key: 'park-day',
      title: 'Park Day',
      story: 'Hello',
      date: 'Jul 26, 2026',
      location: 'Park',
      start_time: '9:00 AM',
      end_time: '5:00 PM',
      visibility: 'public',
      wizard_step: 3,
      nonprofit: { id: 2, category: 'Environment' },
      photos: ['https://example.com/a.jpg'],
      cover_media_id: 7,
    });
    assert.equal(patch.serverEventId, 10);
    assert.equal(patch.fixMode, false);
    assert.equal(patch.guidelinesReviewed, false);
    assert.equal(patch.wizardStep, 3);
    assert.equal(patch.nonprofitId, 2);
    assert.equal(patch.photos.length, 1);
  });

  it('defaults wizardStep to 1 when missing', () => {
    const patch = mapEventToDraftPatch({ id: 1, key: 'x', photos: [] });
    assert.equal(patch.wizardStep, 1);
  });
});
```

- [ ] **Step 3: Add API client**

In `events.js`:

```javascript
export function listMyEvents({ statuses } = {}) {
  const params = new URLSearchParams();
  if (statuses?.length) params.set('statuses', statuses.join(','));
  const qs = params.toString();
  return apiRequest(`/events/mine${qs ? `?${qs}` : ''}`);
}
```

- [ ] **Step 4: Run tests**

Run: `cd charity-app; node --test src/utils/beginEventDraft.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add charity-app/src/utils/beginEventDraft.js charity-app/src/utils/beginEventDraft.test.js charity-app/src/api/events.js
git commit -m "feat(app): hydrate drafts and list my events API"
```

---

### Task 9: Frontend — Drafts screens + Feed/Profile entry + routes

**Files:**
- Create: `charity-app/src/screens/EventDrafts.jsx`
- Create: `charity-app/src/screens/desktop/DesktopEventDrafts.jsx`
- Modify: `charity-app/src/App.jsx`
- Modify: `charity-app/src/screens/FeedScreen.jsx` (create sheet)
- Modify: `charity-app/src/screens/desktop/DesktopFeedScreen.jsx` (if create entry exists)
- Modify: `charity-app/src/screens/ProfileScreen.jsx`
- Modify: `charity-app/src/screens/desktop/DesktopProfileScreen.jsx`

**Interfaces:**
- Consumes: `listMyEvents`, `beginEventDraft`, `beginEventFix`, `wizardStepPath`
- Route: `/event/drafts`

- [ ] **Step 1: Mobile `EventDrafts` screen**

Load on mount:

```javascript
listMyEvents({ statuses: ['Draft', 'Changes Requested'] })
```

Render list rows:
- Title: `ev.title` or `Untitled draft`
- Badge: status
- Snippet: date · location when present
- Button: if `Draft` → **Edit draft**; if `Changes Requested` → **Fix & resubmit**

Handlers:

```javascript
import { beginEventDraft } from '../utils/beginEventDraft';
import { beginEventFix } from '../utils/beginEventFix';
import { wizardStepPath } from '../utils/changeRequestAreas';

function openDraft(ev) {
  if (ev.status === 'Changes Requested') {
    beginEventFix(ev);
    navigate('/event/step-4');
    return;
  }
  const { wizardStep } = beginEventDraft(ev) || { wizardStep: 1 };
  navigate(wizardStepPath(wizardStep));
}
```

Empty state: copy + button `resetDraft(); navigate('/event/step-1')`.  
Error state: message + Retry.  
Use `MobileAppHeader` + back to `/feed`. Match existing list/row styles (`recent-event-row` / cards).

- [ ] **Step 2: Desktop `DesktopEventDrafts`**

Same data/actions; use desktop header/layout patterns from `DesktopProfileScreen` / feed.

- [ ] **Step 3: Route in App.jsx**

```javascript
function EventDraftsRoute() {
  return useIsDesktop() ? <DesktopEventDrafts /> : <EventDrafts />;
}
// ...
<Route path="/event/drafts" element={<EventDraftsRoute />} />
```

- [ ] **Step 4: Feed entry**

In Feed create bottom sheet (`FeedScreen.jsx`), add an `opt-row` **Your drafts** that closes the sheet and `navigate('/event/drafts')`.  
On desktop feed, add an equivalent control near Create event if one exists; otherwise a header/link “Your drafts”.

- [ ] **Step 5: Profile entry**

On `ProfileScreen` and `DesktopProfileScreen`, above “Your events”, add a row/button:

```javascript
<button type="button" className="btn-outline" ... onClick={() => navigate('/event/drafts')}>
  Draft events
</button>
```

Or a full-width `recent-event-row`-style link with ChevronRight.

- [ ] **Step 6: Smoke check**

- Open `/event/drafts` while logged in as SE → list loads or empty state.
- Save a draft mid-wizard → reopen → lands on saved step with prior fields.
- Submit stays disabled until checklist + guidelines.

- [ ] **Step 7: Commit**

```bash
git add charity-app/src/screens/EventDrafts.jsx charity-app/src/screens/desktop/DesktopEventDrafts.jsx charity-app/src/App.jsx charity-app/src/screens/FeedScreen.jsx charity-app/src/screens/desktop/DesktopFeedScreen.jsx charity-app/src/screens/ProfileScreen.jsx charity-app/src/screens/desktop/DesktopProfileScreen.jsx
git commit -m "feat(app): add drafts list with edit and fix entry points"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Today date defaults (new drafts only) | 4 |
| Next gated per step | 5, 6 |
| Submit gated by checklist + guidelines | 5, 6 |
| `guidelinesReviewed` on draft store | 4, 6 |
| `wizard_step` persist + restore | 1–3, 7–9 |
| `GET /events/mine` | 3, 8 |
| Dedicated `/event/drafts` | 9 |
| Feed + Profile links | 9 |
| Edit draft vs Fix & resubmit | 8, 9 |
| Save draft ungated | 6 (unchanged buttons) |

## Self-review notes

- No TBD placeholders; route order for `/mine` called out.
- `mapEventToDraftPatch` extracted so hydration is unit-testable without mocking the store.
- Fix-mode submit uses same helper as checklist filtering.
