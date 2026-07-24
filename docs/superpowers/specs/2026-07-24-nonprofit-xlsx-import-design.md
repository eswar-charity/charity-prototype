# Nonprofit XLSX Import + Reseed — Design (Sub-project A)

**Date:** 2026-07-24
**Status:** Approved — decisions locked 2026-07-24; ready for implementation plan
**Parent effort:** "Import XLSX nonprofits + integrate frontend with live APIs" (decomposed; **A then B**. This is sub-project A — backend data import. Frontend integration is sub-project B, separate later spec.)

---

## 1. Objective

Import the 20 real nonprofits from `USA_20_Well_Known_Nonprofits_with_EIN.xlsx` into the database as the canonical nonprofit directory, replacing the demo nonprofits and relinking the demo events, so the app serves real nonprofit data throughout. Apply to the live Supabase project via the connected Supabase MCP.

## 2. Current live state (discovered)

The FastAPI backend is already deployed to Supabase project `fgqvnuvtwgklboojzjmg`:
- Migrations `0001`–`0010` applied (`alembic_version` = `0010_admin`).
- Already seeded with demo data: `users`=3, `nonprofits`=5 (Hoboken Homeless Home, etc.), `events`=5, `donations`=2, `posts`=2, admin rows.

Therefore this sub-project **adds migration `0011` only** and **reconciles** the existing demo rows rather than seeding from empty. All live-DB changes go through the Supabase MCP (`apply_migration` for DDL, `execute_sql` for data and for bumping `alembic_version`), which is authenticated and avoids the direct-connection/IPv6 issue.

## 3. XLSX source

20 rows, columns: `# | Legal Organization Name | Common Name | EIN | Primary Cause | Headquarters | Founded | What They Do | EIN/Filing Source (URL)`. Parsed with correct UTF-8 (e.g. *Médecins Sans Frontières*). The file is copied to `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx`.

## 4. Schema extension — migration `0011_nonprofit_import_fields`

Add nullable, dialect-portable columns to `nonprofits`:
- `legal_name` VARCHAR(255)
- `headquarters` VARCHAR(160)
- `founded_year` INTEGER
- `source_url` VARCHAR(512)
- `raw_cause` VARCHAR(160) — original "Primary Cause" text (for display)

Authored as an Alembic revision (`down_revision = "0010_admin"`) AND applied to Supabase via MCP `apply_migration`, then `alembic_version` bumped to `0011_nonprofit_import_fields` via `execute_sql` so Alembic stays in sync. `NonprofitRead` gains these optional fields. Test suite (SQLite) builds schema from models via `create_all`, so tests pick the columns up automatically.

## 5. Category mapping (Primary Cause → app browse category)

Kept `raw_cause` for display; `category` set to one of the app's 15 browse categories so filters/search work:

| Primary Cause | category |
|---|---|
| Disaster Relief & Humanitarian Services | Human Services |
| Hunger Relief | Food & Hunger |
| Pediatric Healthcare & Research | Health |
| Affordable Housing | Human Services |
| Community Development | Community |
| Employment & Workforce Development | Human Services |
| Youth Development | Human Services |
| Youth & Community Wellness | Community |
| Youth Mentorship | Human Services |
| Children & Critical Illness | Health |
| Family Healthcare Support | Health |
| Breast Cancer | Health |
| Cancer Research & Patient Support | Health |
| Alzheimer's Research & Caregiver Support | Health |
| Environment & Conservation | Environment |
| Environmental Protection | Environment |
| Clean Water | Environment |
| Wildlife & Environmental Conservation | Environment |
| Animal Welfare | Animals |
| Humanitarian Medical Aid | Health |

Unknown causes fall back to `Community`.

## 6. Parser + import module

- `backend/seed/xlsx_reader.py` — pure-stdlib XLSX reader (zip + XML, correct UTF-8). Returns list of row dicts keyed by header. No new dependency.
- `backend/seed/import_nonprofits.py` — `parse_records(path) -> list[dict]` (applies category mapping, splits EIN/legal/common name, coerces `founded_year`), and `async import_nonprofits(session)` that **idempotently upserts by `ein`**: `name`=Common Name, `legal_name`, `ein`, `category`=mapped, `raw_cause`, `mission`=What They Do, `headquarters`, `founded_year`, `source_url`, `slug`=slug(common name), `verified=True`, `status="Active"`, `settlement_status="Ready"`, `source="ProPublica / IRS BMF"`, `initials`/`color` derived. Re-run updates in place (no duplicates).

## 7. Reseed / reconcile (replace demo NPs, relink events)

`backend/seed/seed.py` becomes the single source of the desired end state and is idempotent:
1. Import the 20 real nonprofits.
2. Create (or keep) SE *Mike Rivera*, admin *Alex Mercer*, NP-admin demo user; link the NP-admin to **American Red Cross**.
3. Create the 5 demo events relinked to real NPs (event `category` kept as authored):
   - `#NeonNight` → United Way
   - `#GiveNowApre'Later` → The Nature Conservancy
   - `#CharityHubGolfOuting` → St. Jude Children's Research Hospital
   - `#DogDads` → ASPCA
   - `#BreakneckRidgeRun` → Sierra Club Foundation
4. Sample donations/posts/admin rows as before.

**Live reconciliation** (the DB already has 5 demo NPs + 5 events wired to them): via MCP `execute_sql` — upsert the 20 NPs, repoint the 5 events' `nonprofit_id` and the `nonprofit_admins` link to the real NPs, then delete the now-orphaned demo NPs. Net end-state matches the seed script exactly.

## 8. Applying to live Supabase (via MCP)

1. `apply_migration("0011_nonprofit_import_fields", <ALTER TABLE ...>)`.
2. `execute_sql`: upsert 20 nonprofits (generated from the parsed XLSX), relink events + nonprofit_admin, delete demo NPs, `UPDATE alembic_version SET version_num='0011_nonprofit_import_fields'`.
3. Verify with `execute_sql` counts (nonprofits = 20, events still 5 and pointing at real NPs).

## 9. Row Level Security

**Decision (2026-07-24): Do not enable RLS as part of A.** Supabase tables remain without RLS. The app stays safe in practice (frontend → FastAPI/JWT; FastAPI uses the direct Postgres role). RLS can be revisited later as optional hardening; it is out of scope for A and for the immediate B frontend integration.

## 10. Testing

SQLite unit tests: `xlsx_reader` (20 rows, header mapping, the UTF-8 row parses correctly), `parse_records` (category mapping incl. fallback, `founded_year` coercion), and `import_nonprofits` idempotency (re-run count stays 20; fields populated). Full suite stays green.

## 11. Out of scope (later sub-project B)

Frontend integration (API client, auth/session, wiring screens to live APIs, loading/empty/error states, toasts). Covered by a separate spec after A lands.

## 12. Closed decisions / remaining notes

| Item | Decision |
|------|----------|
| Execution order | **A then B** |
| RLS (§9) | **No** — skip for A (and not required before B) |
| Secret rotation (Supabase DB password / Cloudinary) | Out of scope for A; user's call separately — not blocking |

No open design items remain for A.
