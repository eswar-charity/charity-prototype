from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import nonprofit_repository as repo


async def list_nonprofits(
    db: AsyncSession,
    search: str | None,
    category: str | None,
    verified_only: bool,
    page: int,
    limit: int,
) -> dict:
    items, total, has_more = await repo.list_nonprofits(
        db, search=search, category=category, verified_only=verified_only,
        page=page, limit=limit,
    )
    return {"items": items, "total": total, "has_more": has_more}


async def get_public_profile(db: AsyncSession, slug: str) -> dict:
    np = await repo.get_by_slug(db, slug)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)
    # Stats/events are aggregated over events+donations, wired in a later phase.
    stats = {"eventsHosted": 0, "totalRaised": 0, "totalBacked": 0}
    return {"nonprofit": np, "stats": stats, "events": []}


async def get_my_nonprofit(db: AsyncSession, user: User) -> Nonprofit:
    np = await repo.get_for_admin(db, user.id)
    if not np:
        raise AppError(
            "not_found", "No nonprofit is linked to this account", status_code=404
        )
    return np


async def update_profile(
    db: AsyncSession,
    user: User,
    *,
    mission: str | None = None,
    logo_media_id: int | None = None,
    cover_media_id: int | None = None,
) -> Nonprofit:
    np = await get_my_nonprofit(db, user)
    fields: dict = {}
    if mission is not None:
        fields["mission"] = mission
    if logo_media_id is not None:
        fields["logo_media_id"] = logo_media_id
    if cover_media_id is not None:
        fields["cover_media_id"] = cover_media_id
    if fields:
        np = await repo.update(db, np, **fields)
    return np
