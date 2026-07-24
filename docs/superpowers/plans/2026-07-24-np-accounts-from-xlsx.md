# NP Accounts from USA_20 XLSX (C1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed 20 short-alias `np_admin` logins (one per USA_20 nonprofit), remove `np@charityhub.com`, and update demo credentials docs/tests.

**Architecture:** Curated alias map in `backend/seed/np_accounts.py` with `ensure_np_accounts(session, by_name)` called from `seed.seed` after `import_nonprofits`. Idempotent get-or-create users + upsert `NonprofitAdmin` links; delete legacy `np@charityhub.com`. No schema migration, no new API routes.

**Tech Stack:** Python 3.12, SQLAlchemy 2.0 async, pytest/aiosqlite, existing `hash_password` / `verify_password`.

**Spec:** `docs/superpowers/specs/2026-07-24-np-accounts-from-xlsx-design.md`

## Global Constraints

- Reuse `backend/.venv`; do not add pip dependencies.
- Tests: `cd backend; .\.venv\Scripts\python.exe -m pytest <path> -v` (Windows PowerShell).
- Shared NP password is exactly `Passw0rd!`.
- Alias emails and nonprofit Common Names must match the table in the spec §3 exactly.
- No Alembic migration; no new FastAPI routes.
- Do not implement C2 (mock purge) or C3 (WebSockets/SSE) in this plan.
- Stage only task-scoped paths per commit; do not commit unrelated dirty files (ApprovalStatus, PDFs, etc.).
- SE (`mike.rivera@demo.charityhub.com`) and Admin (`alex.mercer@charityhub.com`) credentials unchanged.

## File structure

| Path | Responsibility |
|------|----------------|
| `backend/seed/np_accounts.py` | `NP_ACCOUNT_ALIASES`, `LEGACY_NP_EMAIL`, `ensure_np_accounts`, `remove_legacy_np_user` |
| `backend/seed/seed.py` | Call ensure/remove after import; stop creating `np@charityhub.com` |
| `backend/tests/test_np_accounts.py` | Map completeness + ensure/remove unit tests |
| `backend/tests/test_seed.py` | Assert 20 alias admins; assert legacy email absent |
| `backend.md` | Demo NP credentials → 20 aliases |
| `charity-app/README.md` | Demo NP credentials → aliases |
| `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` | Update demo-cred table only |

---

### Task 1: Alias map module + completeness test

**Files:**
- Create: `backend/seed/np_accounts.py`
- Create: `backend/tests/test_np_accounts.py`
- Test: `backend/tests/test_np_accounts.py`

**Interfaces:**
- Consumes: `seed.import_nonprofits.parse_records` (returns list[dict] with key `name` = Common Name)
- Produces:
  - `LEGACY_NP_EMAIL: str` = `"np@charityhub.com"`
  - `NP_DEMO_PASSWORD: str` = `"Passw0rd!"`
  - `NP_ACCOUNT_ALIASES: list[dict]` each with keys `email: str`, `nonprofit_name: str`, `display_name: str`
  - (ensure/remove functions added in Task 2)

- [ ] **Step 1: Write the failing completeness test**

Create `backend/tests/test_np_accounts.py`:

```python
from seed.import_nonprofits import parse_records
from seed.np_accounts import LEGACY_NP_EMAIL, NP_ACCOUNT_ALIASES, NP_DEMO_PASSWORD


def test_alias_map_covers_all_xlsx_common_names():
    names = {r["name"] for r in parse_records()}
    mapped = {a["nonprofit_name"] for a in NP_ACCOUNT_ALIASES}
    assert mapped == names
    assert len(NP_ACCOUNT_ALIASES) == 20


def test_alias_emails_unique_and_domain():
    emails = [a["email"] for a in NP_ACCOUNT_ALIASES]
    assert len(emails) == len(set(emails))
    assert all(e.endswith("@charityhub.com") for e in emails)
    assert LEGACY_NP_EMAIL == "np@charityhub.com"
    assert LEGACY_NP_EMAIL not in emails
    assert NP_DEMO_PASSWORD == "Passw0rd!"
    for a in NP_ACCOUNT_ALIASES:
        assert a["display_name"] == f"{a['nonprofit_name']} Admin"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_np_accounts.py::test_alias_map_covers_all_xlsx_common_names tests/test_np_accounts.py::test_alias_emails_unique_and_domain -v`

Expected: FAIL with `ModuleNotFoundError` or `ImportError` for `seed.np_accounts`

- [ ] **Step 3: Write minimal `np_accounts.py` map**

Create `backend/seed/np_accounts.py`:

```python
"""Curated short-alias NP admin accounts for USA_20 nonprofits."""
from __future__ import annotations

LEGACY_NP_EMAIL = "np@charityhub.com"
NP_DEMO_PASSWORD = "Passw0rd!"

# email, nonprofit Common Name (must match import_nonprofits name), display_name
NP_ACCOUNT_ALIASES: list[dict[str, str]] = [
    {"email": "redcross@charityhub.com", "nonprofit_name": "American Red Cross", "display_name": "American Red Cross Admin"},
    {"email": "feedingamerica@charityhub.com", "nonprofit_name": "Feeding America", "display_name": "Feeding America Admin"},
    {"email": "stjude@charityhub.com", "nonprofit_name": "St. Jude Children's Research Hospital", "display_name": "St. Jude Children's Research Hospital Admin"},
    {"email": "habitat@charityhub.com", "nonprofit_name": "Habitat for Humanity", "display_name": "Habitat for Humanity Admin"},
    {"email": "unitedway@charityhub.com", "nonprofit_name": "United Way", "display_name": "United Way Admin"},
    {"email": "goodwill@charityhub.com", "nonprofit_name": "Goodwill", "display_name": "Goodwill Admin"},
    {"email": "bgca@charityhub.com", "nonprofit_name": "Boys & Girls Clubs of America", "display_name": "Boys & Girls Clubs of America Admin"},
    {"email": "ymca@charityhub.com", "nonprofit_name": "YMCA of the USA", "display_name": "YMCA of the USA Admin"},
    {"email": "bbbs@charityhub.com", "nonprofit_name": "Big Brothers Big Sisters", "display_name": "Big Brothers Big Sisters Admin"},
    {"email": "makeawish@charityhub.com", "nonprofit_name": "Make-A-Wish America", "display_name": "Make-A-Wish America Admin"},
    {"email": "rmhc@charityhub.com", "nonprofit_name": "Ronald McDonald House Charities", "display_name": "Ronald McDonald House Charities Admin"},
    {"email": "komen@charityhub.com", "nonprofit_name": "Susan G. Komen", "display_name": "Susan G. Komen Admin"},
    {"email": "acs@charityhub.com", "nonprofit_name": "American Cancer Society", "display_name": "American Cancer Society Admin"},
    {"email": "alz@charityhub.com", "nonprofit_name": "Alzheimer's Association", "display_name": "Alzheimer's Association Admin"},
    {"email": "nature@charityhub.com", "nonprofit_name": "The Nature Conservancy", "display_name": "The Nature Conservancy Admin"},
    {"email": "sierraclub@charityhub.com", "nonprofit_name": "Sierra Club Foundation", "display_name": "Sierra Club Foundation Admin"},
    {"email": "charitywater@charityhub.com", "nonprofit_name": "charity: water", "display_name": "charity: water Admin"},
    {"email": "wwf@charityhub.com", "nonprofit_name": "World Wildlife Fund (WWF-US)", "display_name": "World Wildlife Fund (WWF-US) Admin"},
    {"email": "aspca@charityhub.com", "nonprofit_name": "ASPCA", "display_name": "ASPCA Admin"},
    {"email": "msf@charityhub.com", "nonprofit_name": "Doctors Without Borders USA", "display_name": "Doctors Without Borders USA Admin"},
]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_np_accounts.py::test_alias_map_covers_all_xlsx_common_names tests/test_np_accounts.py::test_alias_emails_unique_and_domain -v`

Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/seed/np_accounts.py backend/tests/test_np_accounts.py
git commit -m "feat(seed): add curated NP short-alias account map"
```

---

### Task 2: `ensure_np_accounts` + `remove_legacy_np_user`

**Files:**
- Modify: `backend/seed/np_accounts.py`
- Modify: `backend/tests/test_np_accounts.py`
- Test: `backend/tests/test_np_accounts.py`

**Interfaces:**
- Consumes: `NP_ACCOUNT_ALIASES`, `LEGACY_NP_EMAIL`, `NP_DEMO_PASSWORD`; `app.core.security.hash_password`; `app.models.user.User`; `app.models.nonprofit.Nonprofit`, `NonprofitAdmin`; `app.utils.identity.derive_initials`, `pick_color`
- Produces:
  - `async def ensure_np_accounts(session: AsyncSession, by_name: dict[str, Nonprofit]) -> list[User]`
  - `async def remove_legacy_np_user(session: AsyncSession) -> None`

- [ ] **Step 1: Write failing tests for ensure + remove**

Append to `backend/tests/test_np_accounts.py`:

```python
import pytest
from sqlalchemy import select

from app.core.security import hash_password, verify_password
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.user import User
from app.utils.identity import derive_initials, pick_color
from seed.import_nonprofits import import_nonprofits
from seed.np_accounts import (
    LEGACY_NP_EMAIL,
    NP_ACCOUNT_ALIASES,
    NP_DEMO_PASSWORD,
    ensure_np_accounts,
    remove_legacy_np_user,
)


@pytest.mark.asyncio
async def test_ensure_np_accounts_creates_twenty_linked_admins(db_session):
    nps = await import_nonprofits(db_session)
    by_name = {n.name: n for n in nps}
    users = await ensure_np_accounts(db_session, by_name)
    await db_session.flush()

    assert len(users) == 20
    for alias in NP_ACCOUNT_ALIASES:
        u = (
            await db_session.execute(select(User).where(User.email == alias["email"]))
        ).scalar_one()
        assert u.role == "np_admin"
        assert u.name == alias["display_name"]
        assert verify_password(NP_DEMO_PASSWORD, u.password_hash)
        link = (
            await db_session.execute(
                select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
            )
        ).scalar_one()
        assert link.nonprofit_id == by_name[alias["nonprofit_name"]].id


@pytest.mark.asyncio
async def test_ensure_np_accounts_is_idempotent(db_session):
    nps = await import_nonprofits(db_session)
    by_name = {n.name: n for n in nps}
    await ensure_np_accounts(db_session, by_name)
    await ensure_np_accounts(db_session, by_name)
    await db_session.flush()
    count = len(
        (
            await db_session.execute(
                select(User).where(User.role == "np_admin")
            )
        ).scalars().all()
    )
    assert count == 20
    links = (
        await db_session.execute(select(NonprofitAdmin))
    ).scalars().all()
    assert len(links) == 20


@pytest.mark.asyncio
async def test_ensure_np_accounts_missing_nonprofit_raises(db_session):
    with pytest.raises(KeyError):
        await ensure_np_accounts(db_session, {})


@pytest.mark.asyncio
async def test_remove_legacy_np_user(db_session):
    legacy = User(
        role="np_admin",
        email=LEGACY_NP_EMAIL,
        name="Nonprofit Admin",
        password_hash=hash_password(NP_DEMO_PASSWORD),
        initials=derive_initials("Nonprofit Admin"),
        color=pick_color("Nonprofit Admin"),
        status="active",
    )
    db_session.add(legacy)
    await db_session.flush()
    # Minimal nonprofit so we can attach a link (import first)
    nps = await import_nonprofits(db_session)
    db_session.add(
        NonprofitAdmin(user_id=legacy.id, nonprofit_id=nps[0].id)
    )
    await db_session.flush()

    await remove_legacy_np_user(db_session)
    await db_session.flush()

    gone = (
        await db_session.execute(select(User).where(User.email == LEGACY_NP_EMAIL))
    ).scalar_one_or_none()
    assert gone is None
    # Idempotent second call
    await remove_legacy_np_user(db_session)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_np_accounts.py -v`

Expected: FAIL importing or calling `ensure_np_accounts` / `remove_legacy_np_user`

- [ ] **Step 3: Implement ensure + remove**

Append to `backend/seed/np_accounts.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.user import User
from app.utils.identity import derive_initials, pick_color


def _make_user(email: str, display_name: str) -> User:
    return User(
        role="np_admin",
        email=email,
        name=display_name,
        password_hash=hash_password(NP_DEMO_PASSWORD),
        initials=derive_initials(display_name),
        color=pick_color(display_name),
        status="active",
    )


async def ensure_np_accounts(
    session: AsyncSession, by_name: dict[str, Nonprofit]
) -> list[User]:
    users: list[User] = []
    for alias in NP_ACCOUNT_ALIASES:
        np = by_name[alias["nonprofit_name"]]  # KeyError if missing
        u = (
            await session.execute(select(User).where(User.email == alias["email"]))
        ).scalar_one_or_none()
        if u is None:
            u = _make_user(alias["email"], alias["display_name"])
            session.add(u)
            await session.flush()
        else:
            u.role = "np_admin"
            u.name = alias["display_name"]
            u.password_hash = hash_password(NP_DEMO_PASSWORD)
            u.initials = derive_initials(alias["display_name"])
            u.color = pick_color(alias["display_name"])
            u.status = "active"

        link = (
            await session.execute(
                select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
            )
        ).scalar_one_or_none()
        if link is None:
            session.add(NonprofitAdmin(user_id=u.id, nonprofit_id=np.id))
        else:
            link.nonprofit_id = np.id
        users.append(u)
    await session.flush()
    return users


async def remove_legacy_np_user(session: AsyncSession) -> None:
    u = (
        await session.execute(select(User).where(User.email == LEGACY_NP_EMAIL))
    ).scalar_one_or_none()
    if u is None:
        return
    links = (
        await session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
        )
    ).scalars().all()
    for link in links:
        await session.delete(link)
    await session.delete(u)
    await session.flush()
```

Place imports at top of file (merge with existing `__future__` import); keep constants above helpers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_np_accounts.py -v`

Expected: PASS (all tests in file)

- [ ] **Step 5: Commit**

```bash
git add backend/seed/np_accounts.py backend/tests/test_np_accounts.py
git commit -m "feat(seed): ensure 20 NP admins and remove legacy np@ login"
```

---

### Task 3: Wire `seed.py` + update `test_seed.py`

**Files:**
- Modify: `backend/seed/seed.py`
- Modify: `backend/tests/test_seed.py`
- Test: `backend/tests/test_seed.py`

**Interfaces:**
- Consumes: `ensure_np_accounts`, `remove_legacy_np_user` from `seed.np_accounts`
- Produces: Updated `async def seed(session)` end-state with 20 NP admins and no legacy email

- [ ] **Step 1: Update failing expectations in `test_seed.py`**

Replace the block that asserts `np@charityhub.com` → Red Cross (approx lines 50–60) with:

```python
    from seed.np_accounts import LEGACY_NP_EMAIL, NP_ACCOUNT_ALIASES, NP_DEMO_PASSWORD

    legacy = (
        await db_session.execute(
            select(User).where(User.email == LEGACY_NP_EMAIL)
        )
    ).scalar_one_or_none()
    assert legacy is None

    for alias in NP_ACCOUNT_ALIASES:
        u = (
            await db_session.execute(
                select(User).where(User.email == alias["email"])
            )
        ).scalar_one()
        assert u.role == "np_admin"
        assert verify_password(NP_DEMO_PASSWORD, u.password_hash)
        link = (
            await db_session.execute(
                select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
            )
        ).scalar_one()
        assert link.nonprofit_id == by_name[alias["nonprofit_name"]].id

    # Spot-check: St. Jude admin sees golf outing org
    stjude_user = (
        await db_session.execute(
            select(User).where(User.email == "stjude@charityhub.com")
        )
    ).scalar_one()
    stjude_link = (
        await db_session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == stjude_user.id)
        )
    ).scalar_one()
    assert stjude_link.nonprofit_id == by_name["St. Jude Children's Research Hospital"].id
```

Also tighten idempotency test — after double seed, assert NP admin count:

```python
@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session):
    await seed(db_session)
    await seed(db_session)
    events = (
        await db_session.execute(select(func.count()).select_from(Event))
    ).scalar_one()
    assert events == 5
    nps = (
        await db_session.execute(select(func.count()).select_from(Nonprofit))
    ).scalar_one()
    assert nps == 20
    np_admins = (
        await db_session.execute(
            select(func.count()).select_from(User).where(User.role == "np_admin")
        )
    ).scalar_one()
    assert np_admins == 20
```

Keep the existing `users >= 3` assertion or raise to `users >= 22` (Alex + Mike + 20 NP). Prefer:

```python
    assert users >= 22
```

- [ ] **Step 2: Run `test_seed` to verify it fails**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_seed.py -v`

Expected: FAIL (still creates/links only `np@charityhub.com`, missing aliases)

- [ ] **Step 3: Wire `seed.py`**

In `backend/seed/seed.py`:

1. Add import:

```python
from seed.np_accounts import ensure_np_accounts, remove_legacy_np_user
```

2. Remove the block that creates `np_admin` via `get_or_create_user("np_admin", "np@charityhub.com", ...)` and the Red Cross link block (steps labeled “Link NP admin → American Red Cross”).

3. After `nps = await import_nonprofits(session)` and `by_name = {n.name: n for n in nps}`, insert:

```python
    await ensure_np_accounts(session, by_name)
    await remove_legacy_np_user(session)
```

4. Leave Alex/Mike creation and the EVENTS loop unchanged.

Do **not** leave any reference to `np@charityhub.com` in `seed.py`.

- [ ] **Step 4: Run seed tests to verify they pass**

Run: `cd backend; .\.venv\Scripts\python.exe -m pytest tests/test_seed.py tests/test_np_accounts.py -v`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/seed/seed.py backend/tests/test_seed.py
git commit -m "feat(seed): wire 20 NP alias accounts into seed end-state"
```

---

### Task 4: Docs + credential references

**Files:**
- Modify: `backend.md`
- Modify: `charity-app/README.md`
- Modify: `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` (demo credentials table only)
- Optional note only (do not rewrite historical plans end-to-end): add one-line “superseded for NP login by C1 spec” is **not** required; focus on living docs above.

**Interfaces:**
- Consumes: alias list from spec / `np_accounts.py`
- Produces: docs that list NP demo logins without `np@charityhub.com`

- [ ] **Step 1: Update `backend.md`**

Replace the NP section:

```markdown
NP (password Passw0rd! for all — one admin per USA_20 org)
redcross@charityhub.com
stjude@charityhub.com
unitedway@charityhub.com
aspca@charityhub.com
sierraclub@charityhub.com
nature@charityhub.com
… (full list: backend/seed/np_accounts.py / docs/superpowers/specs/2026-07-24-np-accounts-from-xlsx-design.md)
```

Keep SE and Admin lines unchanged. Remove `np@charityhub.com`.

- [ ] **Step 2: Update `charity-app/README.md` credentials table**

Replace the single NP row with a short table or note:

```markdown
| NP | redcross@charityhub.com (and 19 other short aliases) | Passw0rd! |
```

Add a sentence: “Full NP alias list: see `backend/seed/np_accounts.py`.”

- [ ] **Step 3: Update frontend-api integration design demo-cred table**

In `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md`, change the NP admin row to:

| NP admin | `redcross@charityhub.com` (20 short aliases; see C1 NP accounts spec) | Password `Passw0rd!`; each linked to its USA_20 org |

Remove the claim that the only NP login is `np@charityhub.com` → American Red Cross.

- [ ] **Step 4: Grep for leftover living references**

Run: `rg "np@charityhub\\.com" charity-app backend.md backend/seed backend/tests docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md docs/superpowers/specs/2026-07-24-np-accounts-from-xlsx-design.md`

Expected: matches only in the C1 design spec (documenting removal) and possibly historical plan files under `docs/superpowers/plans/` (leave historical plans alone).

- [ ] **Step 5: Commit**

```bash
git add backend.md charity-app/README.md docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md
git commit -m "docs: replace np@ demo login with USA_20 NP short aliases"
```

---

### Task 5: Local DB reseed smoke (manual)

**Files:** none (ops)

**Interfaces:**
- Consumes: wired `python -m seed.seed`
- Produces: local Postgres matches C1 end-state

- [ ] **Step 1: Reseed local database**

From `backend/` with env pointing at local/dev DB:

```powershell
.\.venv\Scripts\python.exe -m seed.seed
```

Expected stdout: `Seed complete.`

- [ ] **Step 2: Verify counts via Python one-liner or SQL**

```powershell
.\.venv\Scripts\python.exe -c "import asyncio; from sqlalchemy import select, func; from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker; from app.db.session import engine; from app.models.user import User; from seed.np_accounts import LEGACY_NP_EMAIL, NP_ACCOUNT_ALIASES
async def main():
  maker=async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
  async with maker() as s:
    n=(await s.execute(select(func.count()).select_from(User).where(User.role=='np_admin'))).scalar_one()
    legacy=(await s.execute(select(User).where(User.email==LEGACY_NP_EMAIL))).scalar_one_or_none()
    print('np_admins', n, 'legacy', legacy)
    for a in NP_ACCOUNT_ALIASES[:3]:
      u=(await s.execute(select(User).where(User.email==a['email']))).scalar_one()
      print(u.email, u.name)
  await engine.dispose()
asyncio.run(main())"
```

Expected: `np_admins 20`, `legacy None`, first three alias emails print.

- [ ] **Step 3: Optional API login smoke** (if uvicorn is running)

```powershell
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"stjude@charityhub.com\",\"password\":\"Passw0rd!\"}"
```

Expected: JSON with access token; not 401.

```powershell
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"np@charityhub.com\",\"password\":\"Passw0rd!\"}"
```

Expected: 401 / auth error.

- [ ] **Step 4: Commit only if any smoke script/docs were added** — usually nothing to commit; skip empty commit.

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| 20 short-alias NP admins | Tasks 1–3 |
| Shared password `Passw0rd!` | Tasks 1–2 |
| Remove `np@charityhub.com` | Tasks 2–3, 5 |
| Explicit alias map module | Task 1 |
| Wire into `seed.py` after import | Task 3 |
| No migration / no new routes | Global constraints |
| Update backend.md / README / demo-cred docs | Task 4 |
| Tests for 20 links + legacy absent | Tasks 2–3 |
| C2/C3 out of scope | Global constraints |
| Demo events unchanged | Task 3 leaves EVENTS loop |

No TBD/placeholder steps. Signatures consistent: `ensure_np_accounts(session, by_name) -> list[User]`, `remove_legacy_np_user(session) -> None`.
