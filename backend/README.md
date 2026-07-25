# Charity Hub API

Production-ready **FastAPI** backend for the Charity Hub prototype — a social
participation network for nonprofit storytelling, creative event-led
engagement, and voluntary giving.

Async SQLAlchemy 2.0 + Supabase PostgreSQL, JWT auth with role-based
authorization, Cloudinary media (metadata only), and **mock** Stripe payments /
nonprofit EIN verification.

## Domains / API surface (`/api/v1`)

| Area | Endpoints |
|------|-----------|
| **auth** | register, login, refresh, logout, me, identity-gate, google (GIS ID token) |
| **users** | GET/PATCH `/me/profile` |
| **nonprofits** | `GET /nonprofits` (search/category), `GET /nonprofits/{slug}`, `GET/PATCH /np/profile` |
| **events** | feed (`GET /events`), `GET /events/{key}`, create wizard (`POST /events`, `PATCH /events/{id}`, submit, save-draft), lifecycle (go-live, complete), join/like/save, backers |
| **approvals** | `/np/approvals` queue + approve/reject/request-changes, `/np/autopilot` + trusted-SEs |
| **donations** | quote, create (mock Stripe), get, receipt |
| **feed** | `/events/{key}/posts` thread, `POST /events/{id}/posts`, `/posts/{id}/replies`, `/events/{id}/updates`, chat `/events/{key}/messages` |
| **media** | Cloudinary `/media/sign`, `/media`, `GET/DELETE /media/{id}` |
| **qr** | `/events/{id}/qr`, `/nonprofits/{id}/qr`, `/events/{id}/checkin`, `/events/{id}/attendees` |
| **dashboards** | `/me/notifications`, NP `/np/launchpad|activity|financials`, SE `/se/live-dashboard/{key}`, `/se/post-event/{key}` |
| **admin** | dashboard, review queue + actions, nonprofit lifecycle, events oversight, exceptions, audit log |

Full interactive docs at **`/docs`** (Swagger) and `/redoc`.

## Roles

`se` (Social Entrepreneur), `np_admin` (Non-Profit admin), `platform_admin`,
and `guest_lead` (created when the identity gate captures a phone/email so a
guest can join/donate). Public endpoints (feed, event/nonprofit detail, share
links) need no auth.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
Copy-Item .env.example .env         # then fill in Supabase + Cloudinary values
```

Required `.env` values: `DATABASE_URL` (Supabase asyncpg URL),
`CLOUDINARY_*`, and a strong `JWT_SECRET`. See `.env.example`.

## Run the API

```powershell
uvicorn app.main:app --reload
# http://localhost:8000/docs
```

## Migrations (Supabase Postgres)

```powershell
alembic upgrade head          # apply migrations 0001..0011
```

Migrations are handwritten under `alembic/versions/` and target Postgres.
(The test suite builds its schema directly from the models — see below.)

## Seed demo data

Reproduces the prototype's demo content (SE *Mike Rivera*, admin *Alex Mercer*,
the 5 catalog events, sample donations/posts, and admin review/exception/audit
rows):

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
needed. Cloudinary and Stripe are mocked; bcrypt cost is lowered in tests.

```powershell
python -m pytest -v
```

## Architecture

Clean layering: `api/` (routers) → `services/` (business logic, lifecycle,
permissions) → `repositories/` (DB access) → `models/` (SQLAlchemy).
Cross-cutting: `core/` (config, security, exceptions), `schemas/` (Pydantic),
`integrations/` (Cloudinary, mock Stripe), `utils/` (pagination, receipt math,
identity), `middleware/` (request-id). Uniform error envelope:
`{"error": {"code", "message", "details"}}`.
