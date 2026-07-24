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
