# Charity Hub Backend — Design

**Date:** 2026-07-23
**Status:** Approved (design) — pending implementation plan
**Author:** Backend build for the Charity Hub prototype
**Source inputs:** `backend.md`, `Charity_Hub_Master_Product_Blueprint_v1.0.docx`, the `charity-app/` React prototype, `validation-report.md`

---

## 1. Objective

Build a production-ready FastAPI backend that supports the existing Charity Hub React prototype end-to-end. The backend uses Supabase PostgreSQL, JWT auth with role-based authorization, Cloudinary for media (metadata stored in Postgres), and static/mock integrations for Stripe payments and nonprofit approval/EIN verification.

## 2. Scope

### In scope (frontend parity)
Only the APIs the current React screens actually use are built. Every screen, action, form, list, and CTA across the four roles — **Social Enterprise (SE)**, **Non-Profit (NP)**, **Guest**, **Admin** — gets a backing API. Response shapes match what the screens read, and seed data reproduces the prototype's demo content so the frontend can be pointed at this backend with minimal change.

### Deferred (blueprint-documented, absent from current frontend)
These are **not** built now (they exist in the Master Blueprint but not in the React prototype). They remain future work:
- Payout / reconciliation **execution** engine (settlement status is surfaced read-only).
- Nonprofit self-service onboarding wizard (EIN pre-check, KYB, W-9, attestations). Onboarding exists only from the Admin reviewer side, matching the prototype.
- Minor-SE parent/guardian consent journey (represented only as an admin review-item *type*, as in the prototype).
- Content moderation queue as a standalone NP surface (only the approvals/review link exists).
- Donation refund/dispute *user* flows (statuses exist on the model + admin exceptions; no donor-facing refund UI).
- Founder/Operator role screens.
- AI Support and SaaS/Commercial journeys.

### Explicit integration decisions
- **Stripe:** mock. Deterministic success/failure by test card; no real API calls. Payout is read-only status.
- **NP approval / EIN:** status validation only (Pending → Approved/Rejected); "re-run EIN" returns a canned source match. No IRS/GuideStar/Charity Navigator calls.
- **Cloudinary:** real. Backend signs uploads; frontend uploads direct-to-Cloudinary; backend stores only metadata (`public_id`, `secure_url`, `resource_type`, `bytes`, `format`, dimensions).
- **Chat:** REST + client polling (mirrors the prototype's seed-and-append model). WebSocket is a later add.
- **Credentials:** provided by the user via `.env` (Supabase + Cloudinary). No credentials are committed.

## 3. Architecture

**Stack:** FastAPI + Uvicorn · SQLAlchemy 2.0 async (asyncpg → Supabase Postgres) · Alembic · Pydantic v2 + pydantic-settings · PyJWT + passlib[bcrypt] · Cloudinary SDK · pytest + httpx.

**Clean-architecture layering:** routers → services → repositories → models. Services hold business logic, lifecycle transitions, and permission checks. Repositories do DB access only. Schemas (Pydantic) and deps are cross-cutting.

```
backend/
  app/
    main.py                 # app factory, router mounting, middleware, CORS
    core/                   # config.py, security.py (JWT/hash), exceptions.py, logging
    db/                     # base.py, session.py (async engine + session)
    models/                 # SQLAlchemy models, one module per domain
    schemas/                # Pydantic request/response, one module per domain
    repositories/           # DB access only
    services/               # business logic, lifecycle, permissions
    api/
      deps.py               # get_db, get_current_user, require_role(...)
      v1/                   # routers per domain
    integrations/           # cloudinary.py, mock_stripe.py
    middleware/             # request-id, error handler, logging
    utils/                  # pagination, slugify, receipt math, initials/color
  alembic/                  # env.py + versions/
  seed/                     # seed.py — mirrors the prototype's demo data
  tests/                    # pytest per domain
  .env.example  requirements.txt  alembic.ini  README.md  docker-compose.yml
```

Backend lives in a new top-level `backend/` folder, sibling to `charity-app/`.

## 4. Data model (parity-scoped)

Denormalized counters on `events` (`backed, joined, updates, chat_count, raised`) are maintained as aggregates over donation/participation/message/post rows. The prototype links entities by *name* strings; the backend introduces real foreign keys while the seed preserves display names so responses match.

- **users** — `id, role(se|np_admin|platform_admin|guest_lead), email, phone, password_hash, name, initials, color, status, created_at`; SE profile: `bio, city, avatar_media_id`; + `user_causes` join.
- **nonprofits** — `id, name, slug, category, ein, verified, status(Draft→Submitted→Pending Verification→Verified→Active→Rejected→Suspended), settlement_status(Ready|Payout hold|Not ready|Frozen), source, mission, logo_media_id, cover_media_id, color, initials, created_at`; **nonprofit_admins** links NP users → nonprofit.
- **events** — `id, key(slug), title, story/mission, subtitle, nonprofit_id, organizer_id, category, kind(se_led|np_led), status(Draft→Submitted→Changes Requested→Approved→Live→Completed→Archived|Cancelled|Rejected), date, start_time, end_time, location, visibility(public|private), is_live, cover_media_id, created_at` + counters. Children: **event_photos**, **event_tags**.
- **posts** — `id, event_id, author_id, phase(before|during|after), text, highlight, host, verified, media_id, media_alt, created_at` → **post_replies** (`id, post_id, author_id, text, media_id, created_at`).
- **chat_messages** — `id, event_id, user_id, text, reaction, host, verified, created_at`.
- **donations** — `id, event_id, donor_id, amount, tip, processing_fee, total, public_name, status(Initiated→Pending→Successful→Failed→Refunded→Disputed), payment_ref, created_at`.
- **participations** (join), **attendees** (`ticket_type, backed, checked_in_at`), **follows**, **saves**, **likes**.
- **notifications** — `id, user_id, type, text, read, created_at`.
- **autopilot_settings** (per nonprofit: `enabled, checks(json)`) + **trusted_ses**.
- **admin_review_items** — `id, type(Nonprofit Verification|SE Event|Content Flag|Payout Exception|Minor SE Consent), title, entity_ref, submitted_by, submitted_role, status(New→In Review→Escalated→Approved|Rejected|Closed), priority, summary, checks(json)`.
- **exceptions** — `id, type(Payout|Donation|Content|Dispute), title, entity_ref, severity, status(Open→In Review→Escalated→Resolved), amount, opened_at`.
- **audit_log** — `id, actor, role, action, target, category, at`.
- **media_assets** — `id, public_id, secure_url, resource_type, format, bytes, width, height, owner_id, entity_type, entity_id, created_at`.
- **categories** — the 15 browse categories / causes taxonomy.

## 5. Auth & RBAC

- **JWT access + refresh**; `passlib`-bcrypt hashing.
- **Roles:** `platform_admin`, `np_admin`, `se`, `guest_lead` (created when the identity gate captures phone/email — mirrors the prototype's join/donate gates converting a guest before join/donate).
- **Public (no auth):** feed, event detail, nonprofit & organizer public profiles, causes, how-it-works, share-link resolution.
- **Identity-gated actions** (per the blueprint Identity Gate table): join, donate, comment/upload, chat, create event — enforced by a `require_role(...)` dependency.
- **Mock verifications:** NP approval = status transition; EIN "re-run" returns a canned source match.

## 6. API surface (`/api/v1`)

**Auth & identity:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/identity-gate`, `POST /auth/google` (mock).

**Users / profiles:** `GET/PATCH /me/profile`, `GET /organizers/{slug}`, `POST /organizers/{slug}/follow`, `GET /me/notifications`, `PATCH /notifications/{id}/read`.

**Nonprofits:** `GET /nonprofits` (search + category), `GET /nonprofits/{slug}`, `GET/PATCH /np/profile`, `GET /np/launchpad`, `GET /np/activity`, `GET /np/financials` (read-only mock settlement).

**Events:** `GET /events` (pagination, `?cause=`, filters live/popular/new/following), `GET /events/{key}`, `POST /events`, `PATCH /events/{id}`, `POST /events/{id}/submit`, `POST /events/{id}/save-draft`, `POST /events/{id}/go-live`, `POST /events/{id}/complete`, `GET /events/{key}/backers`, `POST /events/{id}/join`, `POST /events/{id}/like`, `POST /events/{id}/save`.

**Approvals:** `GET /np/approvals`, `GET /np/approvals/{id}`, `POST /np/approvals/{id}/approve`, `POST /np/approvals/{id}/reject`, `POST /np/approvals/{id}/request-changes`, `GET/PATCH /np/autopilot`, `GET/POST/DELETE /np/autopilot/trusted-ses`.

**Donations (mock Stripe):** `POST /donations/quote`, `POST /donations`, `GET /donations/{id}`, `GET /donations/{id}/receipt`.

**Feed / posts / chat:** `GET /events/{key}/posts`, `POST /events/{id}/posts`, `POST /posts/{id}/replies`, `GET /events/{key}/messages`, `POST /events/{id}/messages`, `POST /events/{id}/updates`.

**Media (Cloudinary):** `POST /media/sign`, `POST /media`, `GET /media/{id}`, `DELETE /media/{id}` — reusable across avatars, event photos/videos, NP logo/cover, post media; validates type/size/count (≤10 per event).

**QR:** `GET /events/{id}/qr`, `GET /nonprofits/{id}/qr`, `POST /events/{id}/checkin`, `GET /events/{id}/attendees`.

**Dashboards / stats:** `GET /se/live-dashboard/{eventKey}`, `GET /se/post-event/{eventKey}`.

**Admin portal:** `GET /admin/dashboard`; `GET /admin/review`, `GET /admin/review/{id}`, `POST /admin/review/{id}/{approve|request-changes|escalate|reject|reopen}`; `GET /admin/nonprofits` (+export), `GET /admin/nonprofits/{id}`, `POST /admin/nonprofits/{id}/{verify|reject|suspend|reinstate|rerun-ein}`, `POST /admin/nonprofits/invite`; `GET /admin/events` (+export), `GET /admin/exceptions`, `POST /admin/exceptions/{id}/{escalate|resolve|reopen}`; `GET /admin/audit` (+CSV export).

**Taxonomy / content:** `GET /categories`, `GET /causes`, `GET /content/how-it-works`.

## 7. Cross-cutting concerns

- **Pagination/filtering/search:** shared `?page&limit` → `{items, total, has_more}`, mirroring `useInfiniteScroll`; reusable query helpers.
- **Cloudinary service:** one reusable module; backend signs upload params, frontend uploads direct, backend persists metadata; server-side type/size/count validation.
- **Mock Stripe:** deterministic — normal cards succeed, a reserved test card (ends `0002`) fails; donation lifecycle transitions recorded. Payout/settlement read-only.
- **Notifications:** rows written on domain events (event approved, new approval request, flagged content); polled via `GET /me/notifications`.
- **Response parity:** Pydantic response schemas return the fields the screens read (e.g. event `key,title,mission,organizer,nonprofit,category,raised,backed,joined,…`); UI-only derivations (gradients, category colors) stay client-side.
- **Errors:** consistent `{error:{code,message,details}}`; central exception handler; Pydantic validation.
- **CORS:** configured for the Vite dev origin.
- **Receipt math (parity):** tip = `$3` if donation ≥ 25 else `max(1, 12%)`; processing fee = `3.964%` of subtotal — matches `calcDonationReceipt`.

## 8. Testing

pytest + httpx. One suite per domain, written with each phase's implementation (TDD). Cover: auth/RBAC gates, lifecycle transitions, donation receipt math + mock charge branches, pagination/filter helpers, media validation, and admin state machines.

**Test database (decided 2026-07-23):** the automated suite runs on **SQLite (aiosqlite)** — the environment has no Docker/local Postgres, and coupling every test run to live Supabase is undesirable. Models are therefore kept **dialect-portable** (integer PKs, generic `JSON`, no Postgres-only `ARRAY`/native `ENUM`/`UUID` columns). The test suite builds schema via `Base.metadata.create_all` on an aiosqlite engine with a `get_db` override. The **real app and Alembic migrations still target Supabase Postgres**; migrations are authored per phase and validated against Supabase once credentials are provided. Cloudinary and Stripe are mocked in tests (their real keys are needed only for runtime/manual verification).

## 9. Seed data

`seed/seed.py` reproduces the prototype's demo content: the 5 events (Neon Night, etc.) with community threads and chat seeds, SE *Mike Rivera*, admin *Alex Mercer*, the nonprofits with their categories/EINs/settlement states, and admin review/exception/audit rows. Names and slugs match the frontend so responses are wire-compatible.

## 10. Implementation phases (dependency-ordered, each reviewable)

1. **Foundation** — scaffold, config, async DB/session, base model, Alembic, health check, error/middleware, test harness.
2. **Auth & users** — JWT, register/login/refresh, identity gate, RBAC deps, profiles.
3. **Media** — Cloudinary service, sign/persist/delete.
4. **Nonprofits** — profiles, launchpad, activity/financials (read).
5. **Events** — create wizard, lifecycle, feed (pagination/filters), detail, join/like/save/backers.
6. **Approvals** — NP queue, approve/reject/request-changes, autopilot/trusted-SE.
7. **Donations** — quote, mock-Stripe charge, receipt.
8. **Feed/posts/chat** — community thread, replies, chat, live updates.
9. **QR** — share links, check-in, attendees.
10. **Notifications & dashboards** — SE live/post-event, notification feed.
11. **Admin portal** — dashboard, review queue, nonprofit lifecycle, events, exceptions, audit.
12. **Seed + OpenAPI polish + README** — full demo seed, Swagger tags/descriptions, run docs.

## 11. Open items for the user

- Provide `.env` values: Supabase Postgres connection string(s) and Cloudinary cloud name/API key/secret.
- Confirm the Vite dev origin(s) for CORS (default `http://localhost:5173`).
