import pytest
from sqlalchemy import select

from app.core.security import hash_password, verify_password
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.user import User
from app.utils.identity import derive_initials, pick_color
from seed.import_nonprofits import import_nonprofits, parse_records
from seed.np_accounts import (
    LEGACY_NP_EMAIL,
    NP_ACCOUNT_ALIASES,
    NP_DEMO_PASSWORD,
    ensure_np_accounts,
    remove_legacy_np_user,
)


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
