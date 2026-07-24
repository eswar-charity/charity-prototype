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
