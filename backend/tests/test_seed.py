import pytest
from sqlalchemy import func, select

from app.core.security import verify_password
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

    mike = (
        await db_session.execute(
            select(User).where(User.email == "mike.rivera@demo.charityhub.com")
        )
    ).scalar_one()
    assert mike.password_hash
    assert verify_password("Passw0rd!", mike.password_hash)

    alex = (
        await db_session.execute(
            select(User).where(User.email == "alex.mercer@charityhub.com")
        )
    ).scalar_one()
    assert alex.password_hash
    assert verify_password("Passw0rd!", alex.password_hash)


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
