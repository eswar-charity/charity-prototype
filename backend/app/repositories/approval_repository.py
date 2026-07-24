from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval import AutopilotSettings, EventReview, TrustedSE
from app.models.event import Event

PENDING_STATUSES = ("Submitted", "Changes Requested")


async def list_pending(db: AsyncSession, nonprofit_id: int) -> list[Event]:
    stmt = (
        select(Event)
        .where(Event.nonprofit_id == nonprofit_id, Event.status.in_(PENDING_STATUSES))
        .order_by(Event.id.desc())
    )
    return list((await db.execute(stmt)).scalars().all())


async def add_review(
    db: AsyncSession, event_id: int, reviewer_id: int, action: str, note: str | None = None
) -> EventReview:
    review = EventReview(
        event_id=event_id, reviewer_id=reviewer_id, action=action, note=note
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_autopilot(db: AsyncSession, nonprofit_id: int) -> AutopilotSettings | None:
    return (
        await db.execute(
            select(AutopilotSettings).where(
                AutopilotSettings.nonprofit_id == nonprofit_id
            )
        )
    ).scalar_one_or_none()


async def upsert_autopilot(
    db: AsyncSession, nonprofit_id: int, enabled: bool | None, checks: list | None
) -> AutopilotSettings:
    ap = await get_autopilot(db, nonprofit_id)
    if ap is None:
        ap = AutopilotSettings(
            nonprofit_id=nonprofit_id,
            enabled=bool(enabled) if enabled is not None else False,
            checks=checks,
        )
        db.add(ap)
    else:
        if enabled is not None:
            ap.enabled = enabled
        if checks is not None:
            ap.checks = checks
    await db.commit()
    await db.refresh(ap)
    return ap


async def list_trusted(db: AsyncSession, nonprofit_id: int) -> list[TrustedSE]:
    return list(
        (
            await db.execute(
                select(TrustedSE).where(TrustedSE.nonprofit_id == nonprofit_id)
            )
        ).scalars().all()
    )


async def add_trusted(db: AsyncSession, nonprofit_id: int, se_user_id: int) -> TrustedSE:
    existing = (
        await db.execute(
            select(TrustedSE).where(
                TrustedSE.nonprofit_id == nonprofit_id,
                TrustedSE.se_user_id == se_user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing
    link = TrustedSE(nonprofit_id=nonprofit_id, se_user_id=se_user_id)
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link


async def remove_trusted(db: AsyncSession, nonprofit_id: int, se_user_id: int) -> bool:
    existing = (
        await db.execute(
            select(TrustedSE).where(
                TrustedSE.nonprofit_id == nonprofit_id,
                TrustedSE.se_user_id == se_user_id,
            )
        )
    ).scalar_one_or_none()
    if not existing:
        return False
    await db.delete(existing)
    await db.commit()
    return True
