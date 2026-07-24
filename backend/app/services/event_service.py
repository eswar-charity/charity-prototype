from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.event import Event
from app.models.user import User
from app.repositories import (
    event_repository as repo,
    media_repository,
    nonprofit_repository,
    user_repository,
)
from app.utils.identity import derive_initials

EDITABLE_STATUSES = ("Draft", "Changes Requested")


def _derive_title(story: str | None) -> str:
    words = [w for w in (story or "").split() if w][:3]
    if not words:
        return "#Event"
    return "#" + "".join(w.capitalize() for w in words)


def _slugify(text: str) -> str:
    base = "".join(c.lower() if c.isalnum() else "-" for c in text).strip("-")
    while "--" in base:
        base = base.replace("--", "-")
    return base or "event"


async def _unique_key(db: AsyncSession, base: str) -> str:
    key = base
    n = 2
    while await repo.get_by_key(db, key) is not None:
        key = f"{base}-{n}"
        n += 1
    return key


async def _to_read(db: AsyncSession, event: Event, include_photos: bool = False) -> dict:
    nonprofit = None
    if event.nonprofit_id:
        np = await nonprofit_repository.get_by_id(db, event.nonprofit_id)
        if np:
            nonprofit = {
                "id": np.id, "name": np.name, "slug": np.slug,
                "initials": np.initials, "color": np.color, "verified": np.verified,
            }
    organizer = None
    if event.organizer_id:
        u = await user_repository.get_by_id(db, event.organizer_id)
        if u:
            organizer = {
                "id": u.id, "name": u.name, "initials": u.initials, "color": u.color,
            }
    photos: list[str] = []
    if include_photos:
        assets = await media_repository.list_by_entity(db, "event_photo", event.id)
        photos = [a.secure_url for a in assets]
    return {
        "id": event.id, "key": event.key, "title": event.title, "story": event.story,
        "subtitle": event.subtitle, "category": event.category, "kind": event.kind,
        "status": event.status, "visibility": event.visibility, "date": event.date,
        "start_time": event.start_time, "end_time": event.end_time,
        "location": event.location, "is_live": event.is_live,
        "cover_media_id": event.cover_media_id, "backed": event.backed,
        "joined": event.joined, "updates": event.updates,
        "chat_count": event.chat_count, "raised": event.raised,
        "nonprofit": nonprofit, "organizer": organizer,
        "tags": [t.tag for t in event.tags], "photos": photos,
    }


async def feed(db, category, discovery, page, limit) -> dict:
    items, total, has_more = await repo.list_feed(
        db, category=category, discovery=discovery, page=page, limit=limit
    )
    return {
        "items": [await _to_read(db, e) for e in items],
        "total": total,
        "has_more": has_more,
    }


async def get_detail(db: AsyncSession, key: str) -> dict:
    event = await repo.get_by_key(db, key)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    return await _to_read(db, event, include_photos=True)


async def _load_owned(db: AsyncSession, user: User, event_id: int) -> Event:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if event.organizer_id != user.id and user.role != "platform_admin":
        raise AppError("forbidden", "Not your event", status_code=403)
    return event


async def create_draft(db: AsyncSession, user: User, data: dict) -> dict:
    tags = data.pop("tags", None)
    title = data.get("title") or _derive_title(data.get("story"))
    key = await _unique_key(db, _slugify(title.lstrip("#")))
    kind = "NP-led" if user.role == "np_admin" else "SE-led"
    event = await repo.create(
        db,
        key=key,
        title=title,
        story=data.get("story"),
        subtitle=data.get("story"),
        nonprofit_id=data.get("nonprofit_id"),
        organizer_id=user.id,
        category=data.get("category"),
        kind=kind,
        status="Draft",
        visibility=data.get("visibility") or "public",
        date=data.get("date"),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        location=data.get("location"),
        cover_media_id=data.get("cover_media_id"),
    )
    if tags:
        await repo.set_tags(db, event, tags)
    return await _to_read(db, event, include_photos=True)


async def update_draft(db: AsyncSession, user: User, event_id: int, data: dict) -> dict:
    event = await _load_owned(db, user, event_id)
    if event.status not in EDITABLE_STATUSES:
        raise AppError(
            "invalid_state",
            f"Event cannot be edited in status '{event.status}'",
            status_code=409,
        )
    tags = data.pop("tags", None)
    fields = {k: v for k, v in data.items() if v is not None}
    if fields:
        event = await repo.update(db, event, **fields)
    if tags is not None:
        event = await repo.set_tags(db, event, tags)
    return await _to_read(db, event, include_photos=True)


async def submit(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_owned(db, user, event_id)
    if event.status not in EDITABLE_STATUSES:
        raise AppError(
            "invalid_state", f"Cannot submit from '{event.status}'", status_code=409
        )
    if event.kind == "NP-led":
        # Nonprofit-led events auto-publish once submitted.
        event = await repo.update(db, event, status="Live", is_live=True)
    else:
        # SE-led events await nonprofit approval (Phase 6).
        event = await repo.update(db, event, status="Submitted")
    return await _to_read(db, event, include_photos=True)


async def go_live(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_owned(db, user, event_id)
    if event.status != "Approved":
        raise AppError(
            "invalid_state", f"Cannot go live from '{event.status}'", status_code=409
        )
    event = await repo.update(db, event, status="Live", is_live=True)
    return await _to_read(db, event, include_photos=True)


async def complete(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_owned(db, user, event_id)
    if event.status != "Live":
        raise AppError(
            "invalid_state", f"Cannot complete from '{event.status}'", status_code=409
        )
    event = await repo.update(db, event, status="Completed", is_live=False)
    return await _to_read(db, event, include_photos=True)


async def join(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    added = await repo.add_participation(db, event_id, user.id)
    if added:
        await repo.update(db, event, joined=event.joined + 1)
    count = await repo.count_participants(db, event_id)
    return {"joined": True, "count": count}


async def like(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    liked = await repo.toggle_like(db, event_id, user.id)
    return {"liked": liked}


async def save(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    saved = await repo.toggle_save(db, event_id, user.id)
    return {"saved": saved}


async def backers(db: AsyncSession, key: str) -> list:
    event = await repo.get_by_key(db, key)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    # Backers are donors; wired in the donations phase. Empty for now.
    return []
