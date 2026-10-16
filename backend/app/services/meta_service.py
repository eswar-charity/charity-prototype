from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.event import Event
from app.repositories import event_repository
from app.services import event_service


def _category_read(c: Category) -> dict:
    return {
        "id": c.id, "name": c.name, "icon": c.icon, "color": c.color,
        "description": c.description,
    }


async def list_categories(db: AsyncSession) -> list[dict]:
    rows = (
        await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    ).scalars().all()
    return [_category_read(c) for c in rows]


async def causes(db: AsyncSession) -> list[dict]:
    """Categories that have public events, with roll-up stats (Causes page)."""
    cats = (
        await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    ).scalars().all()
    events = (
        await db.execute(
            select(Event)
            .where(Event.status.in_(event_repository.FEED_STATUSES))
            .order_by(Event.id)
        )
    ).scalars().all()

    out = []
    for cat in cats:
        in_cat = [e for e in events if e.category == cat.name]
        if not in_cat:
            continue
        featured = next((e for e in in_cat if e.is_live), in_cat[0])
        photos = await event_service._resolve_photos(db, featured)
        out.append({
            **_category_read(cat),
            "event_count": len(in_cat),
            "total_raised": sum(e.raised for e in in_cat),
            "featured": {
                "key": featured.key,
                "title": featured.title,
                "cover": photos[0] if photos else None,
                "cover_focus": featured.cover_focus,
                "is_live": featured.is_live,
                "backed": featured.backed,
            },
        })
    return out
