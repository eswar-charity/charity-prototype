from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import (
    event_repository,
    media_repository,
    nonprofit_repository as repo,
)
from app.schemas.nonprofit import NonprofitRead
from app.services import event_service

PUBLIC_NP_EVENT_STATUSES = ("Live", "Completed")


async def _read_many(db: AsyncSession, nps: list[Nonprofit]) -> list[dict]:
    """Nonprofit rows plus resolved logo/cover URLs (from media assets)."""
    ids = {i for n in nps for i in (n.logo_media_id, n.cover_media_id) if i}
    urls = {
        a.id: a.secure_url for a in await media_repository.get_many(db, list(ids))
    }
    out = []
    for n in nps:
        data = NonprofitRead.model_validate(n).model_dump()
        data["logo_url"] = urls.get(n.logo_media_id)
        data["cover_url"] = urls.get(n.cover_media_id)
        out.append(data)
    return out


async def read_one(db: AsyncSession, np: Nonprofit) -> dict:
    return (await _read_many(db, [np]))[0]


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
    return {"items": await _read_many(db, items), "total": total, "has_more": has_more}


async def get_public_profile(db: AsyncSession, slug: str) -> dict:
    np = await repo.get_by_slug(db, slug)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)

    owned = await event_repository.list_by_nonprofit(db, np.id)
    public_events = [
        e
        for e in owned
        if e.status in PUBLIC_NP_EVENT_STATUSES and e.visibility == "public"
    ]
    event_reads = await event_service._to_read_many(db, public_events)
    stats = {
        "eventsHosted": len(public_events),
        "totalRaised": sum(e.raised or 0 for e in public_events),
        "totalBacked": sum(e.backed or 0 for e in public_events),
    }
    return {"nonprofit": await read_one(db, np), "stats": stats, "events": event_reads}


async def get_my_nonprofit(db: AsyncSession, user: User) -> Nonprofit:
    np = await repo.get_for_admin(db, user.id)
    if not np:
        raise AppError(
            "not_found", "No nonprofit is linked to this account", status_code=404
        )
    return np


async def get_my_profile(db: AsyncSession, user: User) -> dict:
    return await read_one(db, await get_my_nonprofit(db, user))


async def _require_own_image(db: AsyncSession, user: User, media_id: int) -> None:
    asset = await media_repository.get_by_id(db, media_id)
    if asset is None or asset.resource_type != "image":
        raise AppError("invalid_media", "Choose an uploaded image", status_code=400)
    if asset.owner_id != user.id:
        raise AppError("forbidden", "You can only use media you uploaded", status_code=403)


async def update_profile(
    db: AsyncSession,
    user: User,
    *,
    mission: str | None = None,
    logo_media_id: int | None = None,
    cover_media_id: int | None = None,
) -> dict:
    np = await get_my_nonprofit(db, user)
    for media_id in (logo_media_id, cover_media_id):
        if media_id is not None:
            await _require_own_image(db, user, media_id)
    fields: dict = {}
    if mission is not None:
        fields["mission"] = mission
    if logo_media_id is not None:
        fields["logo_media_id"] = logo_media_id
    if cover_media_id is not None:
        fields["cover_media_id"] = cover_media_id
    if fields:
        np = await repo.update(db, np, **fields)
    return await read_one(db, np)
