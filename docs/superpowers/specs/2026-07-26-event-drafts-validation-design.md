# Event Creation Validation, Date Defaults & Draft Editing — Design

**Date:** 2026-07-26  
**Status:** Approved — ready for implementation plan  
**Depends on:** Existing 4-step create-event wizard (`/event/step-1`–`4`), `useCreateEventDraft`, `useEventWizardMutations`, `beginEventFix`, event create/save-draft/submit APIs

---

## 1. Objective

1. Default Step 3 **start** and **end** dates to the **current calendar date** for new events.
2. Keep **Submit for Approval** disabled until all mandatory steps and required fields pass validation; enable only when ready.
3. Add **Edit Existing Draft Events**: a dedicated Drafts list (from Feed and Profile) where users can reopen drafts, edit, save, or submit — preserving prior data and the same validation rules as new creation. Changes Requested events appear in the same list with a distinct **Fix & resubmit** action.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Drafts entry | Dedicated `/event/drafts` screen |
| Navigation to drafts | Both **Feed** and **Profile** |
| Submit readiness | Checklist rules: ≥1 photo, nonprofit, start date + location, guidelines ack |
| Step Next gating | Same rules block **Next** on incomplete steps 1–3 |
| Reopen landing | Last step saved with the draft (`wizard_step` 1–4) |
| List statuses | `Draft` and `Changes Requested` |
| List actions | Draft → **Edit draft**; Changes Requested → **Fix & resubmit** |
| Date default scope | New drafts only (`resetDraft` / `DEFAULT_DRAFT`); never overwrite hydrated drafts |
| Save as draft | Remains available without readiness gate |
| Architecture | Shared validation helpers + `GET /events/mine` + persist `wizard_step` on event |

---

## 3. Architecture

Three coordinated layers on the existing wizard:

```
┌─────────────────────────────────────────────────────────────┐
│  Validation helpers (shared)                                │
│  isStepComplete / isDraftReadyToSubmit                      │
│  → gate Next (steps 1–3) + Submit (step 4)                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Draft store                                                │
│  today dates on fresh draft; guidelinesReviewed on store    │
│  wizardStep tracked client-side while editing               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Backend                                                    │
│  events.wizard_step; GET /events/mine; save accepts step    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Drafts UI                                                  │
│  /event/drafts + Feed/Profile links                         │
│  beginEventDraft vs beginEventFix                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Date defaults (Step 3)

### 4.1 Behavior

- In `useCreateEventDraft.js`, `freshDraft()` / `DEFAULT_DRAFT` set:
  - `startDate` = `formatDisplayDate(new Date())`
  - `endDate` = same value  
  Format matches the date picker (`en-US` short month), e.g. `"Jul 26, 2026"`.
- Remove hardcoded demo dates (`Oct 14, 2025`) only. **Keep** existing default `startTime`, `endTime`, and `location` unchanged in this change set (demo location already satisfies Step 3 location validation).
- Hydrating an existing event via `beginEventDraft` / `beginEventFix` uses server `date` (and related fields); empty server date stays empty (user must fill). Do not inject “today” when hydrating.

### 4.2 Touch points

- `charity-app/src/hooks/useCreateEventDraft.js`
- Tests/fixtures that assert `Oct 14, 2025`

---

## 5. Validation & Submit gating

### 5.1 Shared helpers

New module (e.g. `charity-app/src/utils/eventDraftValidation.js`):

| Helper | Rule |
|--------|------|
| `isStepComplete(1, draft)` | `draft.photos.length > 0` |
| `isStepComplete(2, draft, nonprofit)` | nonprofit present (or `draft.nonprofitId`) |
| `isStepComplete(3, draft)` | `startDate.trim()` and `location.trim()` |
| `isDraftReadyToSubmit(draft, nonprofit, { fixMode, allowedSteps })` | Steps 1–3 complete (or only allowed steps in fix mode) **and** `draft.guidelinesReviewed === true` |

`SubmitChecklist` consumes the same helpers for `done` flags so UI and buttons cannot diverge.

### 5.2 Draft store additions

- `guidelinesReviewed: false` on `DEFAULT_DRAFT`; set `true` when user acknowledges guidelines modal.
- Reset to `false` on `resetDraft()`.
- Optional client field `wizardStep: 1` updated when navigating between steps / on save; persisted via API as `wizard_step`.

### 5.3 UI wiring

| Control | Enabled when |
|---------|----------------|
| Step 1–3 **Next** | `isStepComplete(currentStep, …)` and not `pending` (if any) |
| Step 4 **Submit for Approval** / **Resubmit** | `isDraftReadyToSubmit(…)` and not `pending` |
| **Save as draft** / desktop **Save draft** | Always (auth permitting), unchanged |

Fix mode: Next on locked steps remains blocked by existing `useWizardStepAccess` / `isStepAllowed`; readiness for submit only requires allowed steps + guidelines.

### 5.4 Unchanged backend submit rules

Backend still requires editable status and SE-led `nonprofit_id`. Frontend gating is stricter for UX; do not duplicate full checklist on the server in this change set.

---

## 6. Drafts list & edit / fix flows

### 6.1 Route & screens

- Route: `/event/drafts`
- Mobile + desktop screens (follow existing Feed/Profile responsive split via `useIsDesktop`).

### 6.2 Entry points

- **Feed:** “Your drafts” control near Create event.
- **Profile:** “Draft events” (or equivalent) row/link.

### 6.3 List content

- Source: `GET /events/mine?statuses=Draft,Changes%20Requested`
- Sort: newest first (`id` desc, matching `list_by_organizer`).
- Row: title or “Untitled draft”; status badge; date/location snippet when present.

### 6.4 Actions

| Status | Primary action | Hydration | Navigate to |
|--------|----------------|-----------|-------------|
| `Draft` | **Edit draft** | `beginEventDraft(raw)` — `fixMode: false`, clear allowedSteps/feedback | `/event/step-{wizard_step \|\| 1}` |
| `Changes Requested` | **Fix & resubmit** | Existing `beginEventFix(raw)` | `/event/step-4` (same as Approval “Update event”) |

### 6.5 `beginEventDraft`

Mirror field mapping from `beginEventFix` (id, key, cover, title, photos, story, nonprofit, category, dates, times, location, visibility) with:

- `fixMode: false`
- `allowedSteps: null`
- `changeFeedback: ''`
- `guidelinesReviewed: false` (user must re-ack before submit)
- `wizardStep` from `raw.wizard_step` if present

Empty state: short copy + CTA to create new event (`resetDraft` → `/event/step-1`).

---

## 7. Backend API & schema

### 7.1 Schema

- Alembic migration: add nullable `wizard_step` (`Integer`, 1–4) to `events`.
- SQLAlchemy `Event.wizard_step: Mapped[int | None]`.

### 7.2 `GET /events/mine`

- Auth required; filter `organizer_id == current user`.
- Query param `statuses`: optional comma-separated list. When omitted, default to `Draft` and `Changes Requested`.
- Response: list of event read models including photos, nonprofit summary, `change_request` when present, `wizard_step`.
- Reuse/extend `list_by_organizer` with optional status filter.

### 7.3 Create / save-draft

- Accept optional `wizard_step` (int 1–4) on create and update/save-draft payloads.
- Persist on the event row.
- Client sends current step on every persist (desktop Save draft, Step 4 Save as draft, and `ensurePersisted` before submit).

### 7.4 Unchanged

- Submit endpoint behavior and editable statuses (`Draft`, `Changes Requested`).
- Public feed still excludes drafts.

---

## 8. Error handling

| Case | Behavior |
|------|----------|
| Drafts list fetch fails | Inline error + retry on `/event/drafts` |
| Open/hydrate fails | Toast; remain on list |
| Save / submit fails | Existing `useEventWizardMutations` error handling |
| Missing `wizard_step` on old rows | Treat as `1` |

---

## 9. Testing

| Layer | Cases |
|-------|--------|
| Unit (FE) | Fresh draft dates ≈ today; `isStepComplete` / `isDraftReadyToSubmit`; fix-mode subset; `beginEventDraft` mapping |
| Unit/API (BE) | `/events/mine` status filter; `wizard_step` round-trip on save-draft |
| Manual | Next disabled until step valid; Submit disabled until checklist + guidelines; edit draft restores fields and last step; Fix & resubmit still gated by allowed steps |

---

## 10. Out of scope

- Requiring title, story, end date, or times for Next/Submit (beyond current checklist).
- Changing backend submit to enforce full FE checklist.
- Draft delete UI.
- Persisting `guidelinesReviewed` on the server.
- Redesigning wizard chrome or Approval screen (Approval remains available for Changes Requested).

---

## 11. File touch map (expected)

**Frontend:** `useCreateEventDraft.js`, new `eventDraftValidation.js`, `beginEventDraft.js` (or extend beginEventFix module), `SubmitChecklist.jsx`, `EventStep{1–4}.jsx` + desktop counterparts, `DesktopCreateEventLayout.jsx`, `useEventWizardMutations.js`, `eventDraftPayload.js`, `api/events.js`, new Drafts screens, Feed + Profile links, `App.jsx` routes.

**Backend:** `models/event.py`, migration, schemas, `event_repository.list_by_organizer` filter, `event_service`, `api/v1/events.py` mine endpoint + wizard_step on create/update.
