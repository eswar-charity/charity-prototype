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
