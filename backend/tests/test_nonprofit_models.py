import pytest
from sqlalchemy import select

from app.models.enums import NonprofitStatus, SettlementStatus
from app.models.nonprofit import Nonprofit, NonprofitAdmin


def test_nonprofit_enum_display_values():
    assert NonprofitStatus.verified == "Verified"
    assert NonprofitStatus.pending_verification == "Pending Verification"
    assert SettlementStatus.payout_hold == "Payout hold"
    assert SettlementStatus.ready == "Ready"


@pytest.mark.asyncio
async def test_persist_nonprofit_and_admin(db_session, make_user):
    np = Nonprofit(
        name="Hoboken Homeless Home",
        slug="hoboken-homeless-home",
        category="Community",
        ein="23-7245152",
        verified=True,
        status="Verified",
        settlement_status="Ready",
        source="IRS BMF",
        mission="Housing for all",
        color="#C62828",
        initials="HHH",
    )
    db_session.add(np)
    await db_session.commit()
    await db_session.refresh(np)

    admin_user = await make_user(role="np_admin", email="np@e.com")
    link = NonprofitAdmin(user_id=admin_user.id, nonprofit_id=np.id)
    db_session.add(link)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(Nonprofit).where(Nonprofit.slug == "hoboken-homeless-home"))
    ).scalar_one()
    assert fetched.verified is True
    assert fetched.status == "Verified"
    linked = (
        await db_session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == admin_user.id)
        )
    ).scalar_one()
    assert linked.nonprofit_id == np.id


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
