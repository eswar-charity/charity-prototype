from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create(db: AsyncSession, user_id: int, type: str, text: str) -> Notification:
    n = Notification(user_id=user_id, type=type, text=text)
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return n


async def list_for_user(db: AsyncSession, user_id: int) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    )
    return list((await db.execute(stmt)).scalars().all())


async def get_by_id(db: AsyncSession, notification_id: int) -> Notification | None:
    return (
        await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
    ).scalar_one_or_none()


async def mark_read(db: AsyncSession, notification: Notification) -> Notification:
    notification.read = True
    await db.commit()
    await db.refresh(notification)
    return notification
