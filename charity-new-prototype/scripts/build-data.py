"""Build the prototype's static JSON from the existing project's seed data.

Read-only against the rest of the repo: it parses backend/seed/*.py with `ast`
(no imports, no DB) and writes JSON into ../src/data. Run from anywhere:

    python -I charity-new-prototype/scripts/build-data.py
"""
import ast
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / "src" / "data"
sys.path.insert(0, str(ROOT / "backend"))

from seed.xlsx_reader import read_xlsx_rows  # noqa: E402  (stdlib only)


def literal(path: Path, name: str):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == name for t in node.targets):
            return ast.literal_eval(node.value)
        if isinstance(node, ast.AnnAssign) and getattr(node.target, "id", None) == name:
            return ast.literal_eval(node.value)
    raise KeyError(name)


seed = ROOT / "backend" / "seed" / "seed.py"
demo = ROOT / "backend" / "seed" / "demo_content.py"

imp = ROOT / "backend" / "seed" / "import_nonprofits.py"
cause_map = literal(imp, "CAUSE_TO_CATEGORY")


def slugify(name):
    s = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")
    while "--" in s:
        s = s.replace("--", "-")
    return s


nonprofits = []
for row in read_xlsx_rows(ROOT / "backend" / "data" / "USA_20_Well_Known_Nonprofits_with_EIN.xlsx"):
    common = row.get("Common Name", "").strip()
    if not common:
        continue
    cause = row.get("Primary Cause", "").strip()
    nonprofits.append({
        "name": common, "slug": slugify(common),
        "legalName": row.get("Legal Organization Name", "").strip(),
        "ein": row.get("EIN", "").strip(), "category": cause_map.get(cause, "Community"),
        "cause": cause, "mission": row.get("What They Do", "").strip(),
        "headquarters": row.get("Headquarters", "").strip(),
        "founded": int("".join(ch for ch in row.get("Founded", "") if ch.isdigit())[:4] or 0) or None,
    })
np_by_name = {n["name"]: n for n in nonprofits}
categories = [
    {"name": n, "icon": i, "color": c, "description": literal(demo, "CAUSE_COPY").get(
        n, f"Events and gatherings supporting {n.lower()} causes.")}
    for n, i, c in literal(demo, "CATEGORIES")
]
focus = literal(demo, "COVER_FOCUS")
fixes = literal(demo, "TEXT_FIXES")

events = []
for (key, title, np_name, category, mission, date, start, end, loc,
     backed, joined, chat, raised, updates) in literal(seed, "EVENTS"):
    events.append({
        "key": key, "title": title, "nonprofit": np_by_name[np_name]["slug"],
        "category": category, "mission": mission, "date": date,
        "start": start, "end": end, "location": loc, "backed": backed,
        "joined": joined, "chat": chat, "raised": raised, "updates": updates,
        "focus": focus.get(key, "center 30%"),
    })

timelines = json.loads((OUT / "timelines.json").read_text(encoding="utf-8"))


def fix(key, text):
    for old, new in fixes.get(key, []):
        text = text.replace(old, new)
    return text


for key, posts in timelines.items():
    for p in posts:
        p["text"] = fix(key, p["text"])
        if p.get("highlight"):
            p["highlight"] = fix(key, p["highlight"])
        for r in p.get("replies", []) or []:
            if isinstance(r, dict) and "text" in r:
                r["text"] = fix(key, r["text"])

(OUT / "timelines.json").write_text(json.dumps(timelines, indent=1, ensure_ascii=False), encoding="utf-8")
for name, data in (("nonprofits", nonprofits), ("categories", categories), ("events", events)):
    (OUT / f"{name}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
print(len(nonprofits), "nonprofits,", len(events), "events,", len(categories), "categories")
