from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin import AdminReviewItem, AuditLogEntry, Exception_
from app.models.event import Event


# --- Review items ---
async def list_reviews(db: AsyncSession, status: str | None = None) -> list[AdminReviewItem]:
    stmt = select(AdminReviewItem)
    if status:
        stmt = stmt.where(AdminReviewItem.status == status)
    stmt = stmt.order_by(AdminReviewItem.id.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get_review(db: AsyncSession, review_id: int) -> AdminReviewItem | None:
    return (
        await db.execute(select(AdminReviewItem).where(AdminReviewItem.id == review_id))
    ).scalar_one_or_none()


async def create_review(db: AsyncSession, **fields) -> AdminReviewItem:
    item = AdminReviewItem(**fields)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_review(db: AsyncSession, item: AdminReviewItem, **fields) -> AdminReviewItem:
    for k, v in fields.items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return item


# --- Exceptions ---
async def list_exceptions(db: AsyncSession, status: str | None = None) -> list[Exception_]:
    stmt = select(Exception_)
    if status:
        stmt = stmt.where(Exception_.status == status)
    stmt = stmt.order_by(Exception_.id.desc())
    return list((await db.execute(stmt)).scalars().all())


async def get_exception(db: AsyncSession, exc_id: int) -> Exception_ | None:
    return (
        await db.execute(select(Exception_).where(Exception_.id == exc_id))
    ).scalar_one_or_none()


async def create_exception(db: AsyncSession, **fields) -> Exception_:
    exc = Exception_(**fields)
    db.add(exc)
    await db.commit()
    await db.refresh(exc)
    return exc


async def update_exception(db: AsyncSession, exc: Exception_, **fields) -> Exception_:
    for k, v in fields.items():
        setattr(exc, k, v)
    await db.commit()
    await db.refresh(exc)
    return exc


# --- Audit log ---
async def add_audit(
    db: AsyncSession, actor: str, role: str | None, action: str,
    target: str | None = None, category: str | None = None,
) -> AuditLogEntry:
    entry = AuditLogEntry(
        actor=actor, role=role, action=action, target=target, category=category
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def list_audit(db: AsyncSession, category: str | None = None) -> list[AuditLogEntry]:
    stmt = select(AuditLogEntry)
    if category:
        stmt = stmt.where(AuditLogEntry.category == category)
    stmt = stmt.order_by(AuditLogEntry.id.desc())
    return list((await db.execute(stmt)).scalars().all())


# --- Aggregates for the dashboard ---
async def count_live_events(db: AsyncSession) -> int:
    return (
        await db.execute(
            select(func.count()).select_from(Event).where(Event.status == "Live")
        )
    ).scalar_one()


async def sum_raised(db: AsyncSession) -> int:
    return (
        await db.execute(select(func.coalesce(func.sum(Event.raised), 0)))
    ).scalar_one()


async def list_events(db: AsyncSession) -> list[Event]:
    return list(
        (await db.execute(select(Event).order_by(Event.id.desc()))).scalars().all()
    )
