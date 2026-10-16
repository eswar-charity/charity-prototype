# Charity Hub API

Production-ready **FastAPI** backend for the Charity Hub prototype — a social
participation network for nonprofit storytelling, creative event-led
engagement, and voluntary giving.

Async SQLAlchemy 2.0 + Supabase PostgreSQL, JWT auth (rotating, revocable
refresh tokens) with role-based authorization, Cloudinary media (server-verified
metadata), **Stripe Connect** payments, and a manual admin check for nonprofit
verification.

## Domains / API surface (`/api/v1`)

| Area | Endpoints |
|------|-----------|
| **auth** | register (SE only), login, refresh (rotating), logout (revokes), me, identity-gate (guests only), google, invites (`GET /auth/invites/{token}`, `POST /auth/accept-invite`) |
| **users** | GET/PATCH `/me/profile` |
| **nonprofits** | `GET /nonprofits` (search/category), `GET /nonprofits/{slug}`, `GET/PATCH /np/profile` |
| **events** | feed (`GET /events`), `GET /events/{key}`, create wizard (`POST /events`, `PATCH /events/{id}`, submit, save-draft), lifecycle (go-live, complete), join/like/save, backers |
| **approvals** | `/np/approvals` queue + approve/reject/request-changes, `/np/autopilot` + trusted-SEs |
| **donations** | quote, create (Stripe PaymentIntent), confirm, get/receipt (donor, event staff or admin only) |
| **payments** | `GET /payments/config`, `POST /webhooks/stripe`, nonprofit Connect onboarding `POST /np/stripe/onboarding`, `GET /np/stripe/status` |
| **feed** | `/events/{key}/posts` thread, `POST /events/{id}/posts`, `/posts/{id}/replies`, `/events/{id}/updates`, chat `/events/{key}/messages` |
| **media** | Cloudinary `/media/sign`, `/media`, `GET/DELETE /media/{id}` |
| **qr / tickets** | `/events/{id}/qr`, `/nonprofits/{id}/qr`, `GET /events/{id}/ticket` (attendee), `POST /events/{id}/checkin` (scan a ticket code or walk-in), `/events/{id}/attendees` |
| **meta** | `GET /categories`, `GET /causes`, `GET /organizers/{id}` (public reference data) |
| **dashboards** | `/me/notifications`, NP `/np/launchpad|activity|financials`, SE `/se/live-dashboard/{key}`, `/se/post-event/{key}` |
| **admin** | dashboard, review queue + actions, nonprofit lifecycle, nonprofit invites (`POST /admin/nonprofits/invite`, `/{id}/invite-admin`), donation refunds, events oversight, exceptions, audit log |

Full interactive docs at **`/docs`** (Swagger) and `/redoc`.

## Roles

`se` (Social Entrepreneur), `np_admin` (Non-Profit admin), `platform_admin`,
and `guest_lead` (created when the identity gate captures a phone/email so a
guest can join/donate). Public endpoints (feed, event/nonprofit detail, share
links) need no auth.

**Account creation is controlled:** only `se` accounts can self-register.
Nonprofit admins are **invite-only** — a platform admin issues a single-use link
(7-day expiry, stored hashed) and the nonprofit sets its own password at
`/accept-invite`. The identity gate only ever issues sessions for `guest_lead`
accounts. Repeated bad passwords lock an account for 15 minutes; unauthenticated
endpoints are rate limited.

**Event approval is one step:** a nonprofit approving a Submitted event publishes
it (`Live`). There is no separate `Approved` state.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
Copy-Item .env.example .env         # then fill in Supabase + Cloudinary values
```

Required `.env` values: `DATABASE_URL` (Supabase asyncpg URL), `CLOUDINARY_*`, a
strong `JWT_SECRET`, `CORS_ORIGINS` and `PUBLIC_BASE_URL` for the deployed
frontend, and for real payments `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` and
`STRIPE_WEBHOOK_SECRET`. See `.env.example`. **Never put real values in
`.env.example`** — it is tracked by git; real values go in `.env` (ignored).

### Stripe

Donations use Connect *destination charges*: the donor pays
donation + tip + processing fee; the nonprofit's connected account receives the
donation and the platform keeps tip + fee (`application_fee_amount`). A donation
only becomes `Successful` once Stripe confirms it (webhook
`payment_intent.succeeded`, or `POST /donations/{id}/confirm`, which re-reads the
PaymentIntent from Stripe).

Webhooks (Stripe Dashboard → Developers → Webhooks → *Add destination* → **Webhook
endpoint**, URL `https://<api-host>/api/v1/webhooks/stripe`). Create **two**:

| Endpoint | "Events from" | Events | Secret → env var |
|---|---|---|---|
| Platform | **Your account** | `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created` | `STRIPE_WEBHOOK_SECRET` |
| Connect | **Connected accounts** | `account.updated` | `STRIPE_CONNECT_WEBHOOK_SECRET` |

The API accepts either secret. For local development run
`stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe` and use the
`whsec_...` it prints. Nonprofits onboard through
`POST /np/stripe/onboarding` (hosted Express onboarding). With no
`STRIPE_SECRET_KEY` a deterministic dev-only mock is used (never in production).

## Run the API

```powershell
uvicorn app.main:app --reload
# http://localhost:8000/docs
```

## Migrations (Supabase Postgres)

```powershell
alembic upgrade head          # apply migrations 0001..0015
```

Migrations are handwritten under `alembic/versions/` and target Postgres.
(The test suite builds its schema directly from the models — see below.)

## Seed demo data

Reproduces the prototype's demo content (SE *Mike Rivera*, admin *Alex Mercer*,
the 5 catalog events, the cause categories, the full before/during/after
community timelines with replies, event photos — uploaded to Cloudinary when
configured — sample donations, and admin review/exception/audit rows). It is
idempotent and never resets a password someone has changed:

```powershell
python -m seed.seed
```

## Nonprofit directory (XLSX)

Canonical directory: `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` (20 orgs).
`python -m seed.seed` upserts these nonprofits, links demo events to United Way /
Nature Conservancy / St. Jude / ASPCA / Sierra Club Foundation, and attaches the
demo NP admin to American Red Cross. Migration `0011_nonprofit_import_fields`
adds `legal_name`, `headquarters`, `founded_year`, `source_url`, `raw_cause`.

## Tests

The automated suite runs on **SQLite (aiosqlite)** — no external services
needed. Cloudinary and Stripe are faked; bcrypt cost is lowered in tests, and
`tests/conftest.py` blanks real credentials so the suite never touches live services.

```powershell
python -m pytest -v
```

## Architecture

Clean layering: `api/` (routers) → `services/` (business logic, lifecycle,
permissions) → `repositories/` (DB access) → `models/` (SQLAlchemy).
Cross-cutting: `core/` (config, security, exceptions), `schemas/` (Pydantic),
`integrations/` (Cloudinary, Stripe, dev mock), `utils/` (pagination, receipt math,
identity), `middleware/` (request-id). Uniform error envelope:
`{"error": {"code", "message", "details"}}`.
