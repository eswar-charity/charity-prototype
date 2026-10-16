from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendee import Attendee


async def create(db: AsyncSession, **fields) -> Attendee:
    attendee = Attendee(**fields)
    db.add(attendee)
    await db.commit()
    await db.refresh(attendee)
    return attendee


async def get_by_ticket(
    db: AsyncSession, event_id: int, ticket_code: str
) -> Attendee | None:
    return (
        await db.execute(
            select(Attendee).where(
                Attendee.event_id == event_id, Attendee.ticket_code == ticket_code
            )
        )
    ).scalar_one_or_none()


async def list_by_event(db: AsyncSession, event_id: int) -> list[Attendee]:
    stmt = (
        select(Attendee)
        .where(Attendee.event_id == event_id)
        .order_by(Attendee.id.desc())
    )
    return list((await db.execute(stmt)).scalars().all())
