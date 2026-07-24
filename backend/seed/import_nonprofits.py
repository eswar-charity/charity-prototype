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
