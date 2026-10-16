from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.utils.pagination import paginate


async def list_nonprofits(
    db: AsyncSession,
    *,
    search: str | None = None,
    category: str | None = None,
    verified_only: bool = False,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Nonprofit], int, bool]:
    stmt = select(Nonprofit)
    if verified_only:
        stmt = stmt.where(Nonprofit.verified.is_(True))
    if category:
        stmt = stmt.where(Nonprofit.category == category)
    if search:
        stmt = stmt.where(func.lower(Nonprofit.name).like(f"%{search.lower()}%"))
    stmt = stmt.order_by(Nonprofit.name)
    return await paginate(db, stmt, page, limit)


async def get_by_slug(db: AsyncSession, slug: str) -> Nonprofit | None:
    result = await db.execute(select(Nonprofit).where(Nonprofit.slug == slug))
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, nonprofit_id: int) -> Nonprofit | None:
    result = await db.execute(select(Nonprofit).where(Nonprofit.id == nonprofit_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **fields) -> Nonprofit:
    np = Nonprofit(**fields)
    db.add(np)
    await db.commit()
    await db.refresh(np)
    return np


async def update(db: AsyncSession, np: Nonprofit, **fields) -> Nonprofit:
    for key, value in fields.items():
        setattr(np, key, value)
    await db.commit()
    await db.refresh(np)
    return np


async def get_for_admin(db: AsyncSession, user_id: int) -> Nonprofit | None:
    stmt = (
        select(Nonprofit)
        .join(NonprofitAdmin, NonprofitAdmin.nonprofit_id == Nonprofit.id)
        .where(NonprofitAdmin.user_id == user_id)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_by_stripe_account(db: AsyncSession, account_id: str) -> Nonprofit | None:
    result = await db.execute(
        select(Nonprofit).where(Nonprofit.stripe_account_id == account_id)
    )
    return result.scalar_one_or_none()


async def admin_user_ids(db: AsyncSession, nonprofit_id: int) -> list[int]:
    rows = await db.execute(
        select(NonprofitAdmin.user_id).where(NonprofitAdmin.nonprofit_id == nonprofit_id)
    )
    return list(rows.scalars().all())


async def link_admin(db: AsyncSession, user_id: int, nonprofit_id: int) -> NonprofitAdmin:
    link = NonprofitAdmin(user_id=user_id, nonprofit_id=nonprofit_id)
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link
