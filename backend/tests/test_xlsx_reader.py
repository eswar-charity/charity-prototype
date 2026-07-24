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
