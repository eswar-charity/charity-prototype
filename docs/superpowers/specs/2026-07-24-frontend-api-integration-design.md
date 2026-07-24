# Frontend ↔ Live API Integration — Design (Sub-project B)

**Date:** 2026-07-24
**Status:** Approved — decisions locked 2026-07-24; ready for implementation plan
**Parent effort:** "Import XLSX nonprofits + integrate frontend with live APIs" (**A then B**; A complete)
**Depends on:** Live FastAPI + Supabase with 20 XLSX nonprofits and 5 relinked demo events

---

## 1. Objective

Wire the Charity Hub React prototype (`charity-app/`) to the existing FastAPI backend so every implemented user flow for **Guest**, **SE**, **NP**, and **Admin** uses live APIs instead of `mockData` / `adminData`. Preserve UI/UX. Add loading, empty, error, and toast feedback for API actions. Do not invent new backend endpoints in B.

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| AccessGate | **Layered** — keep prototype unlock codes; JWT session underneath |
| API target | **Local FastAPI** — default `http://localhost:8000` |
| Sequencing | **Vertical slices** — B0 foundation → B1 Guest discovery → B2 give/join → B3 SE → B4 NP → B5 Admin |
| Client architecture | Thin `fetch` client + domain modules + AuthContext + UI adapters (no React Query) |
| Mocks | Replace per slice; keep client-only chrome (category icons, event CSS banners, How-it-works / Causes marketing copy) |
| RLS / secrets | Out of scope (unchanged from A) |

## 3. Architecture

```
AccessGate (existing unlock)
  └─ AuthProvider (JWT access + refresh in localStorage)
       └─ App routes / screens
            └─ src/api/client.js  →  GET/POST… /api/v1/*
                 + src/api/{auth,events,nonprofits,…}.js
                 + adapters mapping API JSON → existing screen props
```

**Stack (frontend):** Vite + React 19 + React Router (existing). No new data-fetch library. Reuse/extend existing `useToast` pattern app-wide.

**Config:** `VITE_API_BASE_URL` (default `http://localhost:8000`). Document in `charity-app/.env.example`. Prefer direct CORS (backend already allows `http://localhost:5173`); add Vite proxy only if CORS becomes a blocker.

**API client responsibilities:**
- Prefix `/api/v1`
- Attach `Authorization: Bearer <access_token>` when present
- On 401, attempt refresh once; if refresh fails, clear session
- Parse error envelope `{ error: { code, message, details } }` into a thrown `ApiError`
- JSON by default; support `FormData` only if a screen needs multipart (media uses signed Cloudinary upload, not multipart to FastAPI)

**AuthProvider:**
- Restore session from storage on load (`GET /auth/me`)
- Expose `{ user, login, register, logout, identityGate, googleMock, refresh }`
- Role from `user.role`: `se` | `np_admin` | `platform_admin` | `guest_lead`
- Does not replace AccessGate

## 4. Vertical slices

### B0 — Foundation
- `src/api/client.js`, `src/api/auth.js`, `src/api/users.js`
- `AuthProvider` + wire CreateAccount / TellAboutYou / identity-gate screens
- Shared toast (promote from admin-only)
- `.env.example`

### B1 — Guest discovery
- Feed list with filters + pagination (`GET /events`)
- Event detail live/upcoming (`GET /events/{key}`, backers, like/save)
- Public NP + organizer profiles where screens exist
- Share sheet uses live event/NP ids for QR/share links when APIs exist

### B2 — Guest give / join
- Identity gate → tokens
- Join (`POST /events/{id}/join`)
- Donate quote + create + receipt success screen (mock Stripe)
- Join/donate modals

### B3 — SE create & run
- Event wizard create/update/save-draft/submit + media sign/upload where the wizard uploads
- Approval status, live dashboard, post-event impact
- SE feed/profile, notification bell (`/me/notifications`)

### B4 — NP ops
- Launchpad, activity, financials, profile
- Approvals queue + approve/reject/request-changes
- Autopilot + trusted SEs

### B5 — Admin
- Replace `adminData` with `/admin/*` endpoints across dashboard, review, nonprofits, events, exceptions, audit

**Per-slice exit criteria:** that slice’s screens no longer import mock datasets for primary data; mutations toast success/error; loading/empty/error handled; mobile + desktop twins both wired.

**B complete when:** every implemented backend endpoint that an existing screen needs is connected; remaining static assets are UI-only.

## 5. UX cross-cuts

- **Loading:** spinner/skeleton on initial fetch; disable primary CTA while mutating
- **Empty:** keep or lightly reuse existing empty patterns when lists return zero items
- **Error:** show `error.message` via toast (mutations) or inline + retry (blocking detail fetches)
- **Toasts:** shared success + error variants; used on all mutating API actions
- **Unauthorized actions:** route to existing identity-gate / create-account flows rather than silent failure

## 6. Demo credentials (document only — not hardcoded in UI)

As seeded by backend `seed.seed` / live DB (confirm passwords against seed when wiring B0):

| Role | Email | Notes |
|------|-------|--------|
| SE | `mike.rivera@demo.charityhub.com` | Organizer of catalog events — **may lack password in seed today**; B0 may set a documented demo password |
| NP admin | `redcross@charityhub.com` (20 short aliases; see C1 NP accounts spec) | Password `Passw0rd!`; each linked to its USA_20 org |
| Platform admin | `alex.mercer@charityhub.com` | Admin portal — **may lack password in seed today**; B0 may set a documented demo password |
| Guest | identity-gate email/phone | Creates `guest_lead` |

## 7. Out of scope

- Building new backend endpoints (including unimplemented taxonomy/content routes)
- Real Stripe, real Google OAuth, WebSockets
- Removing or redesigning AccessGate
- Visual redesign of screens / breaking mobile–desktop parity
- RLS enablement and credential rotation

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Response shape ≠ what screens read | Thin adapters per domain; fix adapter before changing UI |
| Event banners still CSS/local assets while API has media ids | Prefer `secure_url` when present; fall back to existing CSS classes by event `key` |
| Seed passwords missing for Mike/Alex | Confirm in seed/auth during B0; set documented demo passwords if needed (backend-only tweak, minimal) |
| Large surface area | Strict slice order; do not start B5 until B0–B2 solid |

## 9. Success criteria

- Guest can browse live events/NPs, join, and complete a mock donation end-to-end against local API
- SE can create/submit an event and view live/post-event dashboards from API data
- NP can approve/reject and use launchpad/financials from API
- Admin portal operates on `/admin/*` without `adminData.js`
- AccessGate still gates the prototype; JWT gates role actions underneath
