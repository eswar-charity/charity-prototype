# Nonprofit XLSX Import + Reseed (Sub-project A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the 20 real U.S. nonprofits from the XLSX into Postgres (schema + idempotent upsert + reseed), replace the 5 demo NPs, and relink the 5 catalog events so the live API serves the real directory.

**Architecture:** Pure-stdlib XLSX reader → `parse_records` (category map + field coercion) → async `import_nonprofits` upsert-by-EIN. Alembic `0011` adds nullable import columns on `nonprofits`. `seed.seed` becomes the single idempotent end-state (20 NPs + 5 events + demo users). Live Supabase is updated via MCP (`apply_migration` + `execute_sql`); no RLS.

**Tech Stack:** Python 3.12, SQLAlchemy 2.0 async, Alembic, pytest/aiosqlite, Supabase MCP. No new pip dependencies (stdlib `zipfile` + `xml.etree` only for XLSX).

**Spec:** `docs/superpowers/specs/2026-07-24-nonprofit-xlsx-import-design.md`

## Global Constraints

- Reuse `backend/.venv`; do **not** `pip install` unless a missing package blocks tests (prefer stdlib).
- Tests: `cd backend && .venv\Scripts\python -m pytest <path> -v` (Windows PowerShell).
- Dialect-portable models only (SQLite tests): Integer/String/Text/Boolean/DateTime — no Postgres-only types.
- Create/modify only `backend/` (+ copy XLSX into `backend/data/`). Stage only task-scoped paths per commit.
- Do **not** enable RLS.
- Live DB changes go through Supabase MCP after `mcp_auth` — not direct `alembic upgrade` against Supabase if IPv6/direct URL fails.
- XLSX real layout: title row 1, disclaimer row 2, blank row 3, **headers on row 4**, data rows 5–24. Headers: `# | Legal Organization Name | Common Name | EIN | Primary Cause | Headquarters | Founded | What They Do | EIN / Filing Source`.
- Event → NP common-name mapping (fixed):
  - `neon-night` / `#NeonNight` → **United Way**
  - `give-now` / `#GiveNowApre'Later` → **The Nature Conservancy**
  - `golf-outing` / `#CharityHubGolfOuting` → **St. Jude Children's Research Hospital**
  - `dog-dad` / `#DogDads` → **ASPCA**
  - `breakneck-ridge-run` / `#BreakneckRidgeRun` → **Sierra Club Foundation**
- NP admin (`np@charityhub.com`) links to **American Red Cross**.
- Category map + fallback `Community` exactly as in the spec (§5).

## File structure

| Path | Responsibility |
|------|----------------|
| `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` | Canonical source file (copied from repo root) |
| `backend/seed/xlsx_reader.py` | Stdlib XLSX → list[dict] keyed by header |
| `backend/seed/import_nonprofits.py` | `CAUSE_TO_CATEGORY`, `parse_records`, `import_nonprofits` |
| `backend/seed/seed.py` | Idempotent end-state seed using importer + event relinks |
| `backend/app/models/nonprofit.py` | New nullable columns |
| `backend/app/schemas/nonprofit.py` | `NonprofitRead` optional fields |
| `backend/alembic/versions/0011_nonprofit_import_fields.py` | ALTER TABLE for Supabase |
| `backend/tests/test_xlsx_reader.py` | Reader tests |
| `backend/tests/test_import_nonprofits.py` | parse + upsert idempotency |
| `backend/tests/test_seed.py` | Updated expectations (20 NPs, real names) |
| `backend/README.md` | Note XLSX import / reseed |

---

### Task 1: Stage XLSX under `backend/data/`

**Files:**
- Create: `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` (binary copy)
- Create: `backend/data/.gitkeep` only if needed; prefer committing the xlsx itself

**Interfaces:**
- Produces: path constant used later — `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` relative to repo; in code resolve via `Path(__file__).resolve().parent.parent / "data" / "USA_20_Well_Known_Nonprofits_with_EIN.xlsx"` from `seed/`.

- [ ] **Step 1: Create directory and copy file**

```powershell
cd c:\charity-prototype
New-Item -ItemType Directory -Force -Path backend\data | Out-Null
Copy-Item -Force USA_20_Well_Known_Nonprofits_with_EIN.xlsx backend\data\USA_20_Well_Known_Nonprofits_with_EIN.xlsx
```

- [ ] **Step 2: Verify size / exists**

```powershell
(Get-Item backend\data\USA_20_Well_Known_Nonprofits_with_EIN.xlsx).Length
```

Expected: `8758` (or same as root file).

- [ ] **Step 3: Commit**

```powershell
git add backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx
git commit -m "chore(backend): add USA 20 nonprofits XLSX under backend/data"
```

---

### Task 2: Stdlib XLSX reader (`xlsx_reader.py`)

**Files:**
- Create: `backend/seed/xlsx_reader.py`
- Test: `backend/tests/test_xlsx_reader.py`

**Interfaces:**
- Produces: `read_xlsx_rows(path: str | Path) -> list[dict[str, str]]` — first non-empty header-like row becomes keys; subsequent rows until blank become dicts. Empty trailing cells → `""`. Shared strings decoded as UTF-8 text nodes joined.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_xlsx_reader.py`:

```python
from pathlib import Path

from seed.xlsx_reader import read_xlsx_rows

XLSX = Path(__file__).resolve().parents[1] / "data" / "USA_20_Well_Known_Nonprofits_with_EIN.xlsx"


def test_reads_twenty_nonprofit_rows():
    rows = read_xlsx_rows(XLSX)
    assert len(rows) == 20
    assert "Common Name" in rows[0]
    assert rows[0]["Common Name"] == "American Red Cross"
    assert rows[0]["EIN"] == "53-0196605"
    assert rows[0]["Legal Organization Name"] == "American National Red Cross"
    assert "Headquarters" in rows[0]
    assert rows[0]["Primary Cause"] == "Disaster Relief & Humanitarian Services"


def test_header_aliases_ein_source_column():
    rows = read_xlsx_rows(XLSX)
    # Sheet header is "EIN / Filing Source"
    assert "EIN / Filing Source" in rows[0]
    assert rows[0]["EIN / Filing Source"].startswith("https://")


def test_aspca_and_sierra_present():
    rows = read_xlsx_rows(XLSX)
    names = {r["Common Name"] for r in rows}
    assert "ASPCA" in names
    assert "Sierra Club Foundation" in names
    assert "United Way" in names
```

- [ ] **Step 2: Run tests — expect FAIL**

```powershell
cd backend
.venv\Scripts\python -m pytest tests/test_xlsx_reader.py -v
```

Expected: FAIL (`ModuleNotFoundError` or import error for `seed.xlsx_reader`).

- [ ] **Step 3: Implement `seed/xlsx_reader.py`**

```python
"""Minimal XLSX reader (stdlib only): zip + XML sharedStrings + sheet1."""
from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _col_index(cell_ref: str) -> int:
    m = re.match(r"([A-Z]+)", cell_ref)
    assert m
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def _shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("m:si", NS):
        texts = [
            (t.text or "")
            for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
        ]
        out.append("".join(texts))
    return out


def _sheet_rows(z: zipfile.ZipFile, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows: list[list[str]] = []
    for row in root.findall("m:sheetData/m:row", NS):
        cells: dict[int, str] = {}
        for c in row.findall("m:c", NS):
            ref = c.get("r")
            if not ref:
                continue
            v = c.find("m:v", NS)
            if v is None or v.text is None:
                continue
            raw = v.text
            if c.get("t") == "s":
                val = shared[int(raw)]
            else:
                val = raw
            cells[_col_index(ref)] = val
        if not cells:
            rows.append([])
            continue
        width = max(cells) + 1
        rows.append([cells.get(i, "") for i in range(width)])
    return rows


def read_xlsx_rows(path: str | Path) -> list[dict[str, str]]:
    """Return data rows as dicts keyed by the header row.

    Skips leading title/disclaimer rows until a row whose first cell is `#`
    (or whose cells include both 'Common Name' and 'EIN').
    """
    path = Path(path)
    with zipfile.ZipFile(path) as z:
        shared = _shared_strings(z)
        grid = _sheet_rows(z, shared)

    header_idx = None
    for i, row in enumerate(grid):
        if not row:
            continue
        if row[0].strip() == "#" or (
            "Common Name" in row and "EIN" in row
        ):
            header_idx = i
            break
    if header_idx is None:
        raise ValueError(f"No header row found in {path}")

    headers = [h.strip() for h in grid[header_idx]]
    records: list[dict[str, str]] = []
    for row in grid[header_idx + 1 :]:
        if not any(cell.strip() for cell in row):
            continue
        # pad / trim to header width
        padded = list(row) + [""] * max(0, len(headers) - len(row))
        padded = padded[: len(headers)]
        records.append({headers[i]: padded[i].strip() for i in range(len(headers))})
    return records
```

- [ ] **Step 4: Run tests — expect PASS**

```powershell
.venv\Scripts\python -m pytest tests/test_xlsx_reader.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```powershell
git add backend/seed/xlsx_reader.py backend/tests/test_xlsx_reader.py
git commit -m "feat(backend): add stdlib XLSX reader for nonprofit import"
```

---

### Task 3: `parse_records` + category mapping

**Files:**
- Create: `backend/seed/import_nonprofits.py` (parse + map only in this task; upsert in Task 5)
- Test: `backend/tests/test_import_nonprofits.py`

**Interfaces:**
- Produces:
  - `CAUSE_TO_CATEGORY: dict[str, str]`
  - `DEFAULT_XLSX_PATH: Path`
  - `parse_records(path: str | Path | None = None) -> list[dict]`
  - Each dict keys: `name`, `legal_name`, `ein`, `category`, `raw_cause`, `mission`, `headquarters`, `founded_year` (`int | None`), `source_url`, `slug`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_import_nonprofits.py`:

```python
from seed.import_nonprofits import CAUSE_TO_CATEGORY, parse_records


def test_parse_records_count_and_core_fields():
    rows = parse_records()
    assert len(rows) == 20
    red = next(r for r in rows if r["name"] == "American Red Cross")
    assert red["legal_name"] == "American National Red Cross"
    assert red["ein"] == "53-0196605"
    assert red["category"] == "Human Services"
    assert red["raw_cause"] == "Disaster Relief & Humanitarian Services"
    assert red["headquarters"] == "Washington, D.C."
    assert red["founded_year"] == 1881
    assert red["source_url"].startswith("https://")
    assert red["slug"] == "american-red-cross"
    assert "Disaster response" in red["mission"]


def test_category_mapping_samples():
    rows = {r["name"]: r for r in parse_records()}
    assert rows["Feeding America"]["category"] == "Food & Hunger"
    assert rows["ASPCA"]["category"] == "Animals"
    assert rows["The Nature Conservancy"]["category"] == "Environment"
    assert rows["St. Jude Children's Research Hospital"]["category"] == "Health"
    assert rows["United Way"]["category"] == "Community"


def test_unknown_cause_falls_back_to_community():
    assert CAUSE_TO_CATEGORY.get("Totally Unknown Cause") is None
    # parse_records applies fallback — simulate via map helper if exported,
    # or assert every parsed row has a non-empty category from known set:
    allowed = set(CAUSE_TO_CATEGORY.values()) | {"Community"}
    for r in parse_records():
        assert r["category"] in allowed
```

- [ ] **Step 2: Run — expect FAIL**

```powershell
.venv\Scripts\python -m pytest tests/test_import_nonprofits.py -v
```

Expected: FAIL import error.

- [ ] **Step 3: Implement parse side of `import_nonprofits.py`**

```python
"""Parse XLSX nonprofit rows and upsert into the nonprofits table."""
from __future__ import annotations

from pathlib import Path

from seed.xlsx_reader import read_xlsx_rows

DEFAULT_XLSX_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "USA_20_Well_Known_Nonprofits_with_EIN.xlsx"
)

CAUSE_TO_CATEGORY: dict[str, str] = {
    "Disaster Relief & Humanitarian Services": "Human Services",
    "Hunger Relief": "Food & Hunger",
    "Pediatric Healthcare & Research": "Health",
    "Affordable Housing": "Human Services",
    "Community Development": "Community",
    "Employment & Workforce Development": "Human Services",
    "Youth Development": "Human Services",
    "Youth & Community Wellness": "Community",
    "Youth Mentorship": "Human Services",
    "Children & Critical Illness": "Health",
    "Family Healthcare Support": "Health",
    "Breast Cancer": "Health",
    "Cancer Research & Patient Support": "Health",
    "Alzheimer's Research & Caregiver Support": "Health",
    "Environment & Conservation": "Environment",
    "Environmental Protection": "Environment",
    "Clean Water": "Environment",
    "Wildlife & Environmental Conservation": "Environment",
    "Animal Welfare": "Animals",
    "Humanitarian Medical Aid": "Health",
}


def _slugify(name: str) -> str:
    s = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    while "--" in s:
        s = s.replace("--", "-")
    return s


def _founded_year(raw: str) -> int | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    # take leading 4-digit year if present
    digits = "".join(ch for ch in raw if ch.isdigit())
    if len(digits) >= 4:
        return int(digits[:4])
    try:
        return int(raw)
    except ValueError:
        return None


def map_category(raw_cause: str) -> str:
    return CAUSE_TO_CATEGORY.get(raw_cause.strip(), "Community")


def parse_records(path: str | Path | None = None) -> list[dict]:
    path = Path(path) if path else DEFAULT_XLSX_PATH
    out: list[dict] = []
    for row in read_xlsx_rows(path):
        common = row.get("Common Name", "").strip()
        if not common:
            continue
        raw_cause = row.get("Primary Cause", "").strip()
        out.append(
            {
                "name": common,
                "legal_name": row.get("Legal Organization Name", "").strip() or None,
                "ein": row.get("EIN", "").strip() or None,
                "category": map_category(raw_cause),
                "raw_cause": raw_cause or None,
                "mission": row.get("What They Do", "").strip() or None,
                "headquarters": row.get("Headquarters", "").strip() or None,
                "founded_year": _founded_year(row.get("Founded", "")),
                "source_url": row.get("EIN / Filing Source", "").strip() or None,
                "slug": _slugify(common),
            }
        )
    return out
```

- [ ] **Step 4: Run — expect PASS**

```powershell
.venv\Scripts\python -m pytest tests/test_import_nonprofits.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```powershell
git add backend/seed/import_nonprofits.py backend/tests/test_import_nonprofits.py
git commit -m "feat(backend): parse XLSX nonprofit records with category mapping"
```

---

### Task 4: Model + schema + Alembic `0011`

**Files:**
- Modify: `backend/app/models/nonprofit.py`
- Modify: `backend/app/schemas/nonprofit.py`
- Create: `backend/alembic/versions/0011_nonprofit_import_fields.py`
- Modify: `backend/tests/test_nonprofit_models.py` (assert new fields persist)

**Interfaces:**
- Produces: `Nonprofit.legal_name`, `.headquarters`, `.founded_year`, `.source_url`, `.raw_cause` (all optional); `NonprofitRead` same optional fields; revision id `0011_nonprofit_import_fields`, `down_revision = "0010_admin"`.

- [ ] **Step 1: Extend model test**

Append to `backend/tests/test_nonprofit_models.py`:

```python
@pytest.mark.asyncio
async def test_persist_import_fields(db_session):
    np = Nonprofit(
        name="American Red Cross",
        slug="american-red-cross",
        category="Human Services",
        ein="53-0196605",
        verified=True,
        status="Active",
        settlement_status="Ready",
        legal_name="American National Red Cross",
        headquarters="Washington, D.C.",
        founded_year=1881,
        source_url="https://example.com",
        raw_cause="Disaster Relief & Humanitarian Services",
    )
    db_session.add(np)
    await db_session.commit()
    await db_session.refresh(np)
    assert np.legal_name == "American National Red Cross"
    assert np.founded_year == 1881
    assert np.raw_cause.startswith("Disaster")
```

- [ ] **Step 2: Run — expect FAIL** (columns missing)

```powershell
.venv\Scripts\python -m pytest tests/test_nonprofit_models.py::test_persist_import_fields -v
```

Expected: FAIL (`TypeError` / unexpected keyword).

- [ ] **Step 3: Add columns to model**

In `backend/app/models/nonprofit.py`, after `mission` (before media ids):

```python
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    headquarters: Mapped[str | None] = mapped_column(String(160), nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    raw_cause: Mapped[str | None] = mapped_column(String(160), nullable=True)
```

- [ ] **Step 4: Extend `NonprofitRead`**

In `backend/app/schemas/nonprofit.py`, add optional fields:

```python
    legal_name: str | None = None
    headquarters: str | None = None
    founded_year: int | None = None
    source_url: str | None = None
    raw_cause: str | None = None
```

- [ ] **Step 5: Write Alembic `0011_nonprofit_import_fields.py`**

```python
"""Add nonprofit import metadata columns

Revision ID: 0011_nonprofit_import_fields
Revises: 0010_admin
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0011_nonprofit_import_fields"
down_revision = "0010_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("nonprofits", sa.Column("legal_name", sa.String(length=255), nullable=True))
    op.add_column("nonprofits", sa.Column("headquarters", sa.String(length=160), nullable=True))
    op.add_column("nonprofits", sa.Column("founded_year", sa.Integer(), nullable=True))
    op.add_column("nonprofits", sa.Column("source_url", sa.String(length=512), nullable=True))
    op.add_column("nonprofits", sa.Column("raw_cause", sa.String(length=160), nullable=True))


def downgrade() -> None:
    op.drop_column("nonprofits", "raw_cause")
    op.drop_column("nonprofits", "source_url")
    op.drop_column("nonprofits", "founded_year")
    op.drop_column("nonprofits", "headquarters")
    op.drop_column("nonprofits", "legal_name")
```

- [ ] **Step 6: Run model + nonprofit API smoke**

```powershell
.venv\Scripts\python -m pytest tests/test_nonprofit_models.py tests/test_nonprofit_api.py -v
```

Expected: all PASS (API tests use `create_all` from models).

- [ ] **Step 7: Commit**

```powershell
git add backend/app/models/nonprofit.py backend/app/schemas/nonprofit.py backend/alembic/versions/0011_nonprofit_import_fields.py backend/tests/test_nonprofit_models.py
git commit -m "feat(backend): add nonprofit import fields (model, schema, migration 0011)"
```

---

### Task 5: Async `import_nonprofits` upsert-by-EIN

**Files:**
- Modify: `backend/seed/import_nonprofits.py`
- Modify: `backend/tests/test_import_nonprofits.py`

**Interfaces:**
- Consumes: `parse_records()`, `Nonprofit` model, `derive_initials` / `pick_color` from `app.utils.identity`
- Produces: `async def import_nonprofits(session: AsyncSession, path: str | Path | None = None) -> list[Nonprofit]` — upsert by `ein` (match existing row with same EIN; if EIN missing, match by `slug`). Sets `verified=True`, `status="Active"`, `settlement_status="Ready"`, `source="ProPublica / IRS BMF"`. Returns the 20 Nonprofit instances (flushed, not necessarily committed).

- [ ] **Step 1: Add failing upsert tests**

Append to `backend/tests/test_import_nonprofits.py`:

```python
import pytest
from sqlalchemy import func, select

from app.models.nonprofit import Nonprofit
from seed.import_nonprofits import import_nonprofits


@pytest.mark.asyncio
async def test_import_upserts_twenty(db_session):
    nps = await import_nonprofits(db_session)
    await db_session.commit()
    assert len(nps) == 20
    count = (
        await db_session.execute(select(func.count()).select_from(Nonprofit))
    ).scalar_one()
    assert count == 20
    red = (
        await db_session.execute(
            select(Nonprofit).where(Nonprofit.ein == "53-0196605")
        )
    ).scalar_one()
    assert red.name == "American Red Cross"
    assert red.legal_name == "American National Red Cross"
    assert red.verified is True
    assert red.status == "Active"
    assert red.source == "ProPublica / IRS BMF"


@pytest.mark.asyncio
async def test_import_is_idempotent(db_session):
    await import_nonprofits(db_session)
    await db_session.commit()
    await import_nonprofits(db_session)
    await db_session.commit()
    count = (
        await db_session.execute(select(func.count()).select_from(Nonprofit))
    ).scalar_one()
    assert count == 20
```

- [ ] **Step 2: Run — expect FAIL**

```powershell
.venv\Scripts\python -m pytest tests/test_import_nonprofits.py -v
```

Expected: FAIL (`import_nonprofits` not defined).

- [ ] **Step 3: Implement upsert**

Append to `backend/seed/import_nonprofits.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nonprofit import Nonprofit
from app.utils.identity import derive_initials, pick_color


async def import_nonprofits(
    session: AsyncSession, path: str | Path | None = None
) -> list[Nonprofit]:
    records = parse_records(path)
    result: list[Nonprofit] = []
    for rec in records:
        existing = None
        if rec["ein"]:
            existing = (
                await session.execute(
                    select(Nonprofit).where(Nonprofit.ein == rec["ein"])
                )
            ).scalar_one_or_none()
        if existing is None:
            existing = (
                await session.execute(
                    select(Nonprofit).where(Nonprofit.slug == rec["slug"])
                )
            ).scalar_one_or_none()

        if existing is None:
            existing = Nonprofit(
                name=rec["name"],
                slug=rec["slug"],
                category=rec["category"],
                ein=rec["ein"],
                verified=True,
                status="Active",
                settlement_status="Ready",
                source="ProPublica / IRS BMF",
                mission=rec["mission"],
                legal_name=rec["legal_name"],
                headquarters=rec["headquarters"],
                founded_year=rec["founded_year"],
                source_url=rec["source_url"],
                raw_cause=rec["raw_cause"],
                initials=derive_initials(rec["name"]),
                color=pick_color(rec["name"]),
            )
            session.add(existing)
        else:
            existing.name = rec["name"]
            existing.slug = rec["slug"]
            existing.category = rec["category"]
            existing.ein = rec["ein"]
            existing.verified = True
            existing.status = "Active"
            existing.settlement_status = "Ready"
            existing.source = "ProPublica / IRS BMF"
            existing.mission = rec["mission"]
            existing.legal_name = rec["legal_name"]
            existing.headquarters = rec["headquarters"]
            existing.founded_year = rec["founded_year"]
            existing.source_url = rec["source_url"]
            existing.raw_cause = rec["raw_cause"]
            existing.initials = derive_initials(rec["name"])
            existing.color = pick_color(rec["name"])
        result.append(existing)
    await session.flush()
    return result
```

- [ ] **Step 4: Run — expect PASS**

```powershell
.venv\Scripts\python -m pytest tests/test_import_nonprofits.py -v
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```powershell
git add backend/seed/import_nonprofits.py backend/tests/test_import_nonprofits.py
git commit -m "feat(backend): idempotent nonprofit upsert-by-EIN from XLSX"
```

---

### Task 6: Rewrite `seed.py` + update `test_seed.py`

**Files:**
- Modify: `backend/seed/seed.py`
- Modify: `backend/tests/test_seed.py`

**Interfaces:**
- Consumes: `import_nonprofits(session)`
- Produces: idempotent seed end-state:
  - users: Alex Mercer, Mike Rivera, np@charityhub.com (same emails/passwords as today)
  - 20 nonprofits from XLSX
  - NP admin → American Red Cross
  - 5 events with same keys/titles/counters, `nonprofit_id` from mapping table by common name
  - sample donations/posts/admin rows (entity_ref strings updated to real NP names where they named old demo NPs)

**Idempotency rule:** If `Event.key == "neon-night"` already exists, still ensure 20 NPs via `import_nonprofits`, relink the 5 events + NP admin, and skip re-creating donations/posts/admin duplicates (check by existing neon donations count or review code `RV-2041`).

- [ ] **Step 1: Update failing seed expectations**

Replace assertions in `backend/tests/test_seed.py`:

```python
import pytest
from sqlalchemy import func, select

from app.models.event import Event
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.user import User
from seed.seed import seed


EVENT_NP = {
    "neon-night": "United Way",
    "give-now": "The Nature Conservancy",
    "golf-outing": "St. Jude Children's Research Hospital",
    "dog-dad": "ASPCA",
    "breakneck-ridge-run": "Sierra Club Foundation",
}


@pytest.mark.asyncio
async def test_seed_creates_demo_data(db_session):
    await seed(db_session)
    users = (
        await db_session.execute(select(func.count()).select_from(User))
    ).scalar_one()
    assert users >= 3

    nps = (await db_session.execute(select(Nonprofit))).scalars().all()
    assert len(nps) == 20
    assert any(n.name == "American Red Cross" for n in nps)
    assert not any(n.name == "Hoboken Homeless Home" for n in nps)

    events = (await db_session.execute(select(Event))).scalars().all()
    assert len(events) == 5

    by_name = {n.name: n for n in nps}
    for key, np_name in EVENT_NP.items():
        ev = (
            await db_session.execute(select(Event).where(Event.key == key))
        ).scalar_one()
        assert ev.nonprofit_id == by_name[np_name].id

    neon = (
        await db_session.execute(select(Event).where(Event.key == "neon-night"))
    ).scalar_one()
    assert neon.title == "#NeonNight"
    assert neon.raised == 14280
    assert neon.status == "Live"

    np_admin = (
        await db_session.execute(
            select(User).where(User.email == "np@charityhub.com")
        )
    ).scalar_one()
    link = (
        await db_session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == np_admin.id)
        )
    ).scalar_one()
    assert link.nonprofit_id == by_name["American Red Cross"].id


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
```

- [ ] **Step 2: Run — expect FAIL**

```powershell
.venv\Scripts\python -m pytest tests/test_seed.py -v
```

Expected: FAIL (`len(nps) == 5` path / Hoboken still present).

- [ ] **Step 3: Rewrite `seed.py`**

Replace `EVENTS` nonprofit name column and `seed()` body along these lines (keep counters/dates/titles):

```python
"""Seed the database with demo users/events + the 20 XLSX nonprofits."""
import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import hash_password
from app.db.session import engine
from app.models.admin import AdminReviewItem, AuditLogEntry, Exception_
from app.models.donation import Donation
from app.models.event import Event
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.post import Post
from app.models.user import User
from app.utils.identity import derive_initials, pick_color
from seed.import_nonprofits import import_nonprofits

# (key, title, np_common_name, category, mission, date, start, end, loc,
#  backed, joined, chat, raised, updates)
EVENTS = [
    ("neon-night", "#NeonNight", "United Way", "Community",
     "Let's throw back to the 80's and party for the people!",
     "Nov 14, 2026", "7:00 PM", "10:00 PM", "Prospect Park, Brooklyn NY",
     213, 87, 212, 14280, 38),
    ("give-now", "#GiveNowApre'Later", "The Nature Conservancy", "Sports",
     "Snowboarding + Giving makes for the best Apre'!",
     "Dec 12, 2026", "4:00 PM", "8:00 PM", "Windham Mountain, NY",
     89, 44, 56, 5400, 12),
    ("golf-outing", "#CharityHubGolfOuting", "St. Jude Children's Research Hospital", "Sports",
     "Bring your good times to the course and may the best shooter win.",
     "Oct 17, 2026", "7:00 AM", "3:00 PM", "Westchester, NY",
     72, 36, 48, 6800, 15),
    ("dog-dad", "#DogDads", "ASPCA", "Animals",
     "Give some street cred to all the Dog Dads who stepped up and rescued a pooch.",
     "Nov 21, 2026", "10:00 AM", "1:00 PM", "Central Park, New York NY",
     56, 28, 34, 3200, 8),
    ("breakneck-ridge-run", "#BreakneckRidgeRun", "Sierra Club Foundation", "Environment",
     "Don't give up and don't break your neck.",
     "Oct 24, 2026", "8:00 AM", "2:00 PM", "Breakneck Ridge, Hudson Valley NY",
     145, 62, 89, 8920, 24),
]


def _user(role, email, name, password=None):
    return User(
        role=role, email=email, name=name,
        password_hash=hash_password(password) if password else None,
        initials=derive_initials(name), color=pick_color(name), status="active",
    )


async def seed(session: AsyncSession) -> None:
    # 1) Users (create if missing)
    async def get_or_create_user(role, email, name, password=None):
        u = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if u:
            return u
        u = _user(role, email, name, password)
        session.add(u)
        await session.flush()
        return u

    admin = await get_or_create_user(
        "platform_admin", "alex.mercer@charityhub.com", "Alex Mercer"
    )
    mike = await get_or_create_user(
        "se", "mike.rivera@demo.charityhub.com", "Mike Rivera"
    )
    np_admin = await get_or_create_user(
        "np_admin", "np@charityhub.com", "Nonprofit Admin", "Passw0rd!"
    )

    # 2) Upsert 20 real nonprofits
    nps = await import_nonprofits(session)
    by_name = {n.name: n for n in nps}

    # 3) Link NP admin → American Red Cross
    red_cross = by_name["American Red Cross"]
    link = (
        await session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == np_admin.id)
        )
    ).scalar_one_or_none()
    if link is None:
        session.add(NonprofitAdmin(user_id=np_admin.id, nonprofit_id=red_cross.id))
    else:
        link.nonprofit_id = red_cross.id

    # 4) Events create-or-relink
    events: list[Event] = []
    for (key, title, np_name, category, mission, date, start, end, loc,
         backed, joined, chat, raised, updates) in EVENTS:
        np = by_name[np_name]
        ev = (
            await session.execute(select(Event).where(Event.key == key))
        ).scalar_one_or_none()
        if ev is None:
            ev = Event(
                key=key, title=title, story=mission, subtitle=mission,
                nonprofit_id=np.id, organizer_id=mike.id,
                category=category, kind="SE-led", status="Live", visibility="public",
                date=date, start_time=start, end_time=end, location=loc, is_live=True,
                backed=backed, joined=joined, chat_count=chat, raised=raised,
                updates=updates,
            )
            session.add(ev)
        else:
            ev.nonprofit_id = np.id
            ev.organizer_id = mike.id
            ev.title = title
            ev.story = mission
            ev.subtitle = mission
            ev.category = category
            ev.status = "Live"
            ev.is_live = True
            ev.backed = backed
            ev.joined = joined
            ev.chat_count = chat
            ev.raised = raised
            ev.updates = updates
        events.append(ev)
    await session.flush()

    # 5) Delete orphaned demo nonprofits (no longer referenced)
    keep_ids = {n.id for n in nps}
    referenced = {
        e.nonprofit_id
        for e in (
            await session.execute(select(Event))
        ).scalars().all()
    }
    referenced |= {
        link.nonprofit_id
        for link in (
            await session.execute(select(NonprofitAdmin))
        ).scalars().all()
    }
    orphans = (
        await session.execute(
            select(Nonprofit).where(Nonprofit.id.not_in(keep_ids))
        )
    ).scalars().all()
    for orphan in orphans:
        if orphan.id not in referenced:
            await session.delete(orphan)

    # 6) Sample content once
    neon = next(e for e in events if e.key == "neon-night")
    existing_donations = (
        await session.execute(
            select(func.count()).select_from(Donation).where(Donation.event_id == neon.id)
        )
    ).scalar_one()
    if existing_donations == 0:
        session.add_all([
            Donation(event_id=neon.id, donor_id=mike.id, donation_cents=5000, tip_cents=300,
                     processing_fee_cents=210, total_cents=5510, public_name="Generous Gus",
                     status="Successful", payment_ref="mock_5510_4242"),
            Donation(event_id=neon.id, donor_id=mike.id, donation_cents=2500, tip_cents=300,
                     processing_fee_cents=111, total_cents=2911, public_name="Kind Kim",
                     status="Successful", payment_ref="mock_2911_4242"),
            Post(event_id=neon.id, author_id=mike.id, phase="before", host=True, verified=True,
                 text="Registration is open — grab your neon gear!", highlight="Announcement"),
            Post(event_id=neon.id, author_id=mike.id, phase="during", host=True, verified=True,
                 text="We're live! The dance floor is glowing."),
        ])

    existing_review = (
        await session.execute(
            select(AdminReviewItem).where(AdminReviewItem.code == "RV-2041")
        )
    ).scalar_one_or_none()
    if existing_review is None:
        session.add_all([
            AdminReviewItem(code="RV-2041", type="Nonprofit Verification",
                            title="Verify United Way",
                            entity_ref="United Way", submitted_by="System",
                            submitted_role="system", status="New", priority="High",
                            summary="EIN resolved via IRS BMF.",
                            checks=[{"label": "EIN format", "ok": True},
                                    {"label": "IRS BMF", "ok": True}]),
            AdminReviewItem(code="RV-2042", type="SE Event", title="Review #DogDads",
                            entity_ref="#DogDads", submitted_by="Mike Rivera",
                            submitted_role="se", status="In Review", priority="Medium",
                            summary="SE-created event awaiting brand-safety review."),
            Exception_(code="EX-118", type="Payout", title="Payout hold on golf outing",
                       entity_ref="St. Jude Children's Research Hospital", severity="High",
                       status="Open", amount=6800),
            AuditLogEntry(actor="Alex Mercer", role="platform_admin",
                          action="Verified nonprofit",
                          target="American Red Cross", category="Verification"),
        ])

    await session.commit()


async def main() -> None:
    maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as session:
        await seed(session)
    await engine.dispose()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 4: Run seed + import + nonprofit suites**

```powershell
.venv\Scripts\python -m pytest tests/test_seed.py tests/test_import_nonprofits.py tests/test_nonprofit_api.py tests/test_xlsx_reader.py -v
```

Expected: all PASS.

- [ ] **Step 5: Full suite smoke**

```powershell
.venv\Scripts\python -m pytest -q
```

Expected: all green (fix any breakage from NonprofitRead optional fields — should be backward compatible).

- [ ] **Step 6: Commit**

```powershell
git add backend/seed/seed.py backend/tests/test_seed.py
git commit -m "feat(backend): reseed with 20 XLSX nonprofits and relinked events"
```

---

### Task 7: Apply to live Supabase via MCP

**Files:** none in repo (live DB only). Requires Supabase MCP auth.

**Interfaces:**
- Consumes: migration DDL from Task 4; upsert SQL generated from `parse_records()`; event key → EIN map:
  - neon-night → `13-1635294` (United Way)
  - give-now → `53-0242652` (The Nature Conservancy)
  - golf-outing → `62-0646012` (St. Jude)
  - dog-dad → `13-1623829` (ASPCA)
  - breakneck-ridge-run → `94-6069890` (Sierra Club Foundation)
  - NP admin → EIN `53-0196605` (American Red Cross)

- [ ] **Step 1: Authenticate Supabase MCP**

Call `mcp_auth` on server `plugin-supabase-supabase`, then re-inspect tools (`apply_migration`, `execute_sql`, `list_tables` or equivalent).

- [ ] **Step 2: Apply migration `0011_nonprofit_import_fields`**

Via MCP `apply_migration` with name `0011_nonprofit_import_fields` and SQL:

```sql
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS headquarters VARCHAR(160);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS source_url VARCHAR(512);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS raw_cause VARCHAR(160);
```

- [ ] **Step 3: Bump Alembic version**

```sql
UPDATE alembic_version SET version_num = '0011_nonprofit_import_fields';
```

(If table uses a single-row version tracker as today.)

- [ ] **Step 4: Generate and run upsert SQL for 20 NPs**

From a one-off Python snippet in `backend/`:

```powershell
.venv\Scripts\python -c "from seed.import_nonprofits import parse_records; import json; print(json.dumps(parse_records(), indent=2))"
```

Build `INSERT ... ON CONFLICT` — prefer match on `ein` via:

```sql
-- For each record (example pattern):
INSERT INTO nonprofits (
  name, slug, category, ein, verified, status, settlement_status, source,
  mission, legal_name, headquarters, founded_year, source_url, raw_cause,
  initials, color, created_at
) VALUES (
  '...', '...', '...', '...', true, 'Active', 'Ready', 'ProPublica / IRS BMF',
  '...', '...', '...', 1881, '...', '...',
  '...', '...', NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  ein = EXCLUDED.ein,
  verified = EXCLUDED.verified,
  status = EXCLUDED.status,
  settlement_status = EXCLUDED.settlement_status,
  source = EXCLUDED.source,
  mission = EXCLUDED.mission,
  legal_name = EXCLUDED.legal_name,
  headquarters = EXCLUDED.headquarters,
  founded_year = EXCLUDED.founded_year,
  source_url = EXCLUDED.source_url,
  raw_cause = EXCLUDED.raw_cause,
  initials = EXCLUDED.initials,
  color = EXCLUDED.color;
```

Escape single quotes in mission text (`'` → `''`). Use MCP `execute_sql` in one or a few batches.

- [ ] **Step 5: Relink events + NP admin; delete orphan demo NPs**

```sql
UPDATE events SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '13-1635294')
WHERE key = 'neon-night';
UPDATE events SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '53-0242652')
WHERE key = 'give-now';
UPDATE events SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '62-0646012')
WHERE key = 'golf-outing';
UPDATE events SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '13-1623829')
WHERE key = 'dog-dad';
UPDATE events SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '94-6069890')
WHERE key = 'breakneck-ridge-run';

UPDATE nonprofit_admins
SET nonprofit_id = (SELECT id FROM nonprofits WHERE ein = '53-0196605')
WHERE user_id = (SELECT id FROM users WHERE email = 'np@charityhub.com');

DELETE FROM nonprofits
WHERE ein IS NULL
   OR ein NOT IN (
     '53-0196605','36-3673599','62-0646012','91-1914868','13-1635294',
     '53-0196517','13-5562976','36-3258696','23-1365190','86-0481941',
     '36-2934689','75-1835298','13-1788491','13-3039601','53-0242652',
     '94-6069890','22-3936753','52-1693387','13-1623829','13-3433452'
   );
```

Only run DELETE after confirming no FK violations (events/admins already relinked). If DELETE fails on leftover FKs (admin entity_ref is text-only — fine), fix remaining FKs first.

- [ ] **Step 6: Verify**

```sql
SELECT COUNT(*) AS nonprofits FROM nonprofits;
SELECT key, (SELECT name FROM nonprofits n WHERE n.id = e.nonprofit_id) AS np
FROM events e ORDER BY key;
SELECT version_num FROM alembic_version;
```

Expected: `nonprofits = 20`; five events mapped as in Global Constraints; `version_num = 0011_nonprofit_import_fields`.

- [ ] **Step 7: Commit a short ops note in README (no secrets)**

Update `backend/README.md` Seed section:

```markdown
## Nonprofit directory (XLSX)

Canonical directory: `backend/data/USA_20_Well_Known_Nonprofits_with_EIN.xlsx` (20 orgs).
`python -m seed.seed` upserts these nonprofits, links demo events to United Way /
Nature Conservancy / St. Jude / ASPCA / Sierra Club Foundation, and attaches the
demo NP admin to American Red Cross. Migration `0011_nonprofit_import_fields`
adds `legal_name`, `headquarters`, `founded_year`, `source_url`, `raw_cause`.
```

```powershell
git add backend/README.md
git commit -m "docs(backend): document XLSX nonprofit import and reseed"
```

---

## Deferred / out of scope

- Sub-project **B** (frontend API client, JWT session, replace mocks) — separate spec + plan after A.
- RLS enablement — explicitly declined.
- Secret rotation — user's call, not blocking.

---

## Plan self-review

| Spec section | Task coverage |
|--------------|---------------|
| §3 XLSX source + copy to `backend/data` | Task 1 |
| §6 `xlsx_reader` | Task 2 |
| §5 category map + §6 `parse_records` | Task 3 |
| §4 migration `0011` + model/schema | Task 4 |
| §6 `import_nonprofits` upsert | Task 5 |
| §7 seed rewrite + event map + Red Cross admin | Task 6 |
| §8 live Supabase MCP | Task 7 |
| §9 RLS | Deferred (No) |
| §10 tests | Tasks 2–6 |
| §11 frontend | Out of scope |

No TBD/placeholder steps. EINs and common names taken from the actual XLSX file.
