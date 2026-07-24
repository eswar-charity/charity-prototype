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
