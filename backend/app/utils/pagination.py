from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

MAX_LIMIT = 100


async def paginate(
    db: AsyncSession, stmt, page: int = 1, limit: int = 20
) -> tuple[list, int, bool]:
    """Return (items, total, has_more) for a SELECT statement.

    Shared by all list endpoints; mirrors the frontend useInfiniteScroll shape.
    """
    page = max(1, page)
    limit = max(1, min(limit, MAX_LIMIT))
    total = (
        await db.execute(select(func.count()).select_from(stmt.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(stmt.limit(limit).offset((page - 1) * limit))
    ).scalars().all()
    return list(rows), total, (page * limit) < total
