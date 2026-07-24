from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.donation import Donation


async def create(db: AsyncSession, **fields) -> Donation:
    donation = Donation(**fields)
    db.add(donation)
    await db.commit()
    await db.refresh(donation)
    return donation


async def get_by_id(db: AsyncSession, donation_id: int) -> Donation | None:
    return (
        await db.execute(select(Donation).where(Donation.id == donation_id))
    ).scalar_one_or_none()


async def update(db: AsyncSession, donation: Donation, **fields) -> Donation:
    for key, value in fields.items():
        setattr(donation, key, value)
    await db.commit()
    await db.refresh(donation)
    return donation


async def list_successful_by_event(db: AsyncSession, event_id: int) -> list[Donation]:
    stmt = (
        select(Donation)
        .where(Donation.event_id == event_id, Donation.status == "Successful")
        .order_by(Donation.id.desc())
    )
    return list((await db.execute(stmt)).scalars().all())
