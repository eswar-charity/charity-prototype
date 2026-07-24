import pytest
from sqlalchemy import func, select

from app.models.event import Event
from app.models.nonprofit import Nonprofit
from app.models.user import User
from seed.seed import seed


@pytest.mark.asyncio
async def test_seed_creates_demo_data(db_session):
    await seed(db_session)
    users = (
        await db_session.execute(select(func.count()).select_from(User))
    ).scalar_one()
    assert users >= 3

    events = (await db_session.execute(select(Event))).scalars().all()
    assert len(events) == 5

    neon = (
        await db_session.execute(select(Event).where(Event.key == "neon-night"))
    ).scalar_one()
    assert neon.title == "#NeonNight"
    assert neon.raised == 14280
    assert neon.status == "Live"

    nps = (await db_session.execute(select(Nonprofit))).scalars().all()
    assert len(nps) == 5
    assert any(n.name == "Hoboken Homeless Home" for n in nps)


@pytest.mark.asyncio
async def test_seed_is_idempotent(db_session):
    await seed(db_session)
    await seed(db_session)
    events = (
        await db_session.execute(select(func.count()).select_from(Event))
    ).scalar_one()
    assert events == 5
