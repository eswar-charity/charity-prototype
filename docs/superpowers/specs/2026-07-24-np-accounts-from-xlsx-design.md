# NP Accounts from USA_20 XLSX — Design (Sub-project C1)

**Date:** 2026-07-24  
**Status:** Approved — decisions locked 2026-07-24; ready for implementation plan  
**Parent effort:** Data-driven Charity Hub prototype (NP Excel accounts → strip mocks → live sync)  
**Sequencing:** **C1 → C2 → C3** (this is C1 only)

| Sub-project | Scope |
|---|---|
| **C1 (this spec)** | 20 short-alias NP admin logins from USA_20; remove `np@charityhub.com` |
| **C2 (later)** | Strip remaining mock/hardcoded catalogs; fully data-driven UI/metrics |
| **C3 (later)** | WebSockets/SSE so event and related updates push to all open clients |

---

## 1. Objective

Replace the single demo Non-Profit login (`np@charityhub.com`) with **20 `np_admin` accounts**, one per organization in `USA_20_Well_Known_Nonprofits_with_EIN.xlsx`, using curated short-alias emails and a shared demo password. Each login is linked to exactly one nonprofit so existing NP launchpad / approvals / financials scoping continues to work.

USA_20 remains the source of truth for nonprofit **org** rows (already imported). This sub-project makes **accounts** match that directory.

---

## 2. Locked decisions

| Topic | Decision |
|---|---|
| Account model | **20 NP admins** — one per USA_20 org |
| Email style | **Short aliases** (e.g. `redcross@charityhub.com`, `stjude@charityhub.com`) |
| Password | Shared demo password `Passw0rd!` for all 20 |
| Old login | **Remove** `np@charityhub.com` (no alias, no soft keep) |
| Implementation | Explicit **alias map** module (Approach 1), not slug-derived emails |
| Schema | **No migration** — use existing `users` + `nonprofit_admins` |
| Frontend in C1 | Credential/doc string updates only; no mock purge; no NP signup UI |
| Later work | C2 (data-driven UI), C3 (true live sync via WebSockets/SSE) |

---

## 3. Alias map

All accounts: `role = np_admin`, password `Passw0rd!`, display name `"{Common Name} Admin"`.

| Alias email | Nonprofit (Common Name) |
|---|---|
| `redcross@charityhub.com` | American Red Cross |
| `feedingamerica@charityhub.com` | Feeding America |
| `stjude@charityhub.com` | St. Jude Children's Research Hospital |
| `habitat@charityhub.com` | Habitat for Humanity |
| `unitedway@charityhub.com` | United Way |
| `goodwill@charityhub.com` | Goodwill |
| `bgca@charityhub.com` | Boys & Girls Clubs of America |
| `ymca@charityhub.com` | YMCA of the USA |
| `bbbs@charityhub.com` | Big Brothers Big Sisters |
| `makeawish@charityhub.com` | Make-A-Wish America |
| `rmhc@charityhub.com` | Ronald McDonald House Charities |
| `komen@charityhub.com` | Susan G. Komen |
| `acs@charityhub.com` | American Cancer Society |
| `alz@charityhub.com` | Alzheimer's Association |
| `nature@charityhub.com` | The Nature Conservancy |
| `sierraclub@charityhub.com` | Sierra Club Foundation |
| `charitywater@charityhub.com` | charity: water |
| `wwf@charityhub.com` | World Wildlife Fund (WWF-US) |
| `aspca@charityhub.com` | ASPCA |
| `msf@charityhub.com` | Doctors Without Borders USA |

XLSX path (unchanged): `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` (root copy may exist for reference; seed uses `backend/data/`).

---

## 4. Architecture

```
USA_20 XLSX
  └─ import_nonprofits()     → 20 Nonprofit rows (existing)
       └─ ensure_np_accounts(session, by_name)
            ├─ NP_ACCOUNT_ALIASES (curated map)
            ├─ get-or-create User (np_admin + Passw0rd!)
            ├─ upsert NonprofitAdmin (user → that nonprofit only)
            └─ delete User np@charityhub.com (+ its NonprofitAdmin rows)
```

**New module:** `backend/seed/np_accounts.py`

- `NP_ACCOUNT_ALIASES: list[dict]` with keys `email`, `nonprofit_name`, `display_name`
- `async ensure_np_accounts(session, by_name: dict[str, Nonprofit]) -> list[User]`
  - Resolve each `nonprofit_name` via `by_name`; fail loudly in tests/seed if a name is missing
  - Idempotent: re-run ensures password hash is set to `Passw0rd!`, syncs `name` from `display_name`, re-links admin row
  - Ensures each alias user has **exactly one** `NonprofitAdmin` row pointing at the mapped org

**`backend/seed/seed.py` changes:**

1. Keep platform admin Alex Mercer and SE Mike Rivera as today  
2. After `import_nonprofits`, call `ensure_np_accounts`  
3. **Stop** creating `np@charityhub.com`  
4. Remove legacy user: if `np@charityhub.com` exists, delete `NonprofitAdmin` rows for that user, then delete the user  
5. Leave the five demo events linked as today (United Way, Nature Conservancy, St. Jude, ASPCA, Sierra Club) so those NP aliases see non-empty launchpads immediately  

No new FastAPI routes. Login remains `POST /auth/login` → JWT → `GET /auth/me` → NP screens scoped by linked nonprofit.

---

## 5. Live / local database reconciliation

- **Local:** from `backend/`, run `python -m seed.seed` against the configured Postgres.  
- **Live Supabase (if used):** apply the same end-state via that seed command against the live DB or equivalent upsert/delete SQL — **no DDL**.  
- End-state checks:
  - `users` with `role = np_admin` and email in the alias set = **20**
  - `nonprofit_admins` = at least one row per those 20 users, matching the map
  - `SELECT … WHERE email = 'np@charityhub.com'` → **0 rows**

---

## 6. Frontend & docs (C1 only)

**Docs**

- Update `backend.md`, `charity-app/README.md`, and demo-credential tables in related specs/plans to remove `np@charityhub.com` and document the alias list (full table or representative examples + pointer to `np_accounts.py` / this spec).

**Frontend**

- Replace any hardcoded `np@charityhub.com` hint strings with e.g. `redcross@charityhub.com` or “see demo NP list”.  
- Create-account Continue for Non-profit role remains **login** (email + password); no NP registration flow in C1.  
- Role routing unchanged: `np_admin` → `/np/home` (or existing NP home route).

**Permissions**

Unchanged RBAC: NP APIs already scope by `NonprofitAdmin.nonprofit_id`. Each alias sees only its org’s events, approvals, and metrics.

---

## 7. Testing

- Unit/integration around seed: after `seed()`, assert 20 alias emails exist as `np_admin`, each linked to the correct nonprofit name/id.  
- Assert `np@charityhub.com` is absent.  
- Update `backend/tests/test_seed.py` (and any other tests that hardcode the old email).  
- Optional smoke: login as `stjude@charityhub.com` returns user whose linked nonprofit is St. Jude (if auth tests exist; otherwise covered by seed link assertions).

---

## 8. Success criteria

- Login `stjude@charityhub.com` / `Passw0rd!` → NP home scoped to St. Jude; demo golf outing metrics visible.  
- Login `unitedway@charityhub.com` / `Passw0rd!` → Neon Night–scoped data.  
- Login `redcross@charityhub.com` / `Passw0rd!` → valid NP session; launchpad may be empty/zero until events are linked to Red Cross (**expected**).  
- Login `np@charityhub.com` → authentication failure.  
- SE (`mike.rivera@demo.charityhub.com`) and Admin (`alex.mercer@charityhub.com`) flows unchanged.

---

## 9. Out of scope

- C2: removing `eventData.js` / `mockData.js` catalogs; dynamic cross-screen metrics from API only  
- C3: WebSockets/SSE / true multi-client live sync  
- Event delete API (unless already required elsewhere)  
- NP self-registration, EIN document verification, or changing Blueprint NP approval UX  
- Reassigning the five demo events onto American Red Cross  
- Changing SE or platform-admin credentials  

---

## 10. Closed decisions

| Item | Decision |
|---|---|
| Approach | Explicit alias map (`np_accounts.py`) |
| Old email | Deleted, not aliased |
| Password | `Passw0rd!` for all 20 |
| Order vs C2/C3 | C1 first, then C2, then C3 |

No open design items remain for C1.
