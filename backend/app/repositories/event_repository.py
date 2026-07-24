from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import (
    Event,
    EventLike,
    EventSave,
    EventTag,
    Participation,
)
from app.utils.pagination import paginate

FEED_STATUSES = ("Live", "Approved", "Completed")


async def list_feed(
    db: AsyncSession,
    *,
    category: str | None = None,
    discovery: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Event], int, bool]:
    stmt = select(Event).where(
        Event.visibility == "public", Event.status.in_(FEED_STATUSES)
    )
    if category:
        stmt = stmt.where(Event.category == category)
    if discovery == "live":
        stmt = stmt.where(Event.is_live.is_(True)).order_by(Event.id.desc())
    elif discovery == "popular":
        stmt = stmt.order_by(Event.backed.desc(), Event.id.desc())
    elif discovery == "new":
        stmt = stmt.order_by(Event.created_at.desc(), Event.id.desc())
    else:
        stmt = stmt.order_by(Event.id.desc())
    return await paginate(db, stmt, page, limit)


async def get_by_key(db: AsyncSession, key: str) -> Event | None:
    return (
        await db.execute(select(Event).where(Event.key == key))
    ).scalar_one_or_none()


async def get_by_id(db: AsyncSession, event_id: int) -> Event | None:
    return (
        await db.execute(select(Event).where(Event.id == event_id))
    ).scalar_one_or_none()


async def create(db: AsyncSession, **fields) -> Event:
    ev = Event(**fields)
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return ev


async def update(db: AsyncSession, event: Event, **fields) -> Event:
    for key, value in fields.items():
        setattr(event, key, value)
    await db.commit()
    await db.refresh(event)
    return event


async def set_tags(db: AsyncSession, event: Event, tags: list[str]) -> Event:
    event.tags.clear()
    for tag in tags:
        event.tags.append(EventTag(tag=tag))
    await db.commit()
    await db.refresh(event)
    return event


async def list_by_organizer(db: AsyncSession, organizer_id: int) -> list[Event]:
    return list(
        (
            await db.execute(
                select(Event).where(Event.organizer_id == organizer_id).order_by(
                    Event.id.desc()
                )
            )
        ).scalars().all()
    )


async def list_by_nonprofit(db: AsyncSession, nonprofit_id: int) -> list[Event]:
    return list(
        (
            await db.execute(
                select(Event).where(Event.nonprofit_id == nonprofit_id).order_by(
                    Event.id.desc()
                )
            )
        ).scalars().all()
    )


async def add_participation(db: AsyncSession, event_id: int, user_id: int) -> bool:
    existing = (
        await db.execute(
            select(Participation).where(
                Participation.event_id == event_id, Participation.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        return False
    db.add(Participation(event_id=event_id, user_id=user_id))
    await db.commit()
    return True


async def count_participants(db: AsyncSession, event_id: int) -> int:
    return (
        await db.execute(
            select(func.count()).select_from(Participation).where(
                Participation.event_id == event_id
            )
        )
    ).scalar_one()


async def toggle_like(db: AsyncSession, event_id: int, user_id: int) -> bool:
    existing = (
        await db.execute(
            select(EventLike).where(
                EventLike.event_id == event_id, EventLike.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
        return False
    db.add(EventLike(event_id=event_id, user_id=user_id))
    await db.commit()
    return True


async def toggle_save(db: AsyncSession, event_id: int, user_id: int) -> bool:
    existing = (
        await db.execute(
            select(EventSave).where(
                EventSave.event_id == event_id, EventSave.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
        return False
    db.add(EventSave(event_id=event_id, user_id=user_id))
    await db.commit()
    return True
