from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.event import Event
from app.models.user import User
from app.repositories import (
    approval_repository as arepo,
    donation_repository,
    event_repository as repo,
    media_repository,
    nonprofit_repository,
    notification_repository,
    user_repository,
)
from app.utils.change_request_note import decode_change_request_note
from app.utils.identity import derive_initials

EDITABLE_STATUSES = ("Draft", "Changes Requested")
# Direct link access for non-owners: only after NP approval publishes Live (or completed).
PUBLIC_DETAIL_STATUSES = ("Live", "Completed")

async def _resolve_photos(db: AsyncSession, event: Event) -> list[str]:
    assets = await media_repository.list_by_entity(db, "event_photo", event.id)
    urls = [a.secure_url for a in assets if a.secure_url]
    if urls:
        return urls
    if event.cover_media_id:
        cover = await media_repository.get_by_id(db, event.cover_media_id)
        if cover and cover.secure_url:
            return [cover.secure_url]
    # Events without uploads stay empty — do not invent stock art.
    return []


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


class _ReadContext:
    """Rows needed to render many events, fetched in a handful of queries.

    Without this every event costs ~3 extra round trips (nonprofit, organizer,
    photos) - fine on localhost, seconds over a real network.
    """

    def __init__(self, nonprofits, users, photos, covers):
        self.nonprofits = nonprofits  # {id: Nonprofit}
        self.users = users            # {id: User}
        self.photos = photos          # {event_id: [secure_url]}
        self.covers = covers          # {media_id: secure_url}


async def _prefetch(db: AsyncSession, events: list[Event]) -> _ReadContext:
    np_ids = list({e.nonprofit_id for e in events if e.nonprofit_id})
    user_ids = list({e.organizer_id for e in events if e.organizer_id})
    nps = {n.id: n for n in await nonprofit_repository.get_many(db, np_ids)}
    users = {u.id: u for u in await user_repository.get_many(db, user_ids)}
    photos: dict[int, list[str]] = {}
    for a in await media_repository.list_by_entities(db, "event_photo", [e.id for e in events]):
        if a.secure_url:
            photos.setdefault(a.entity_id, []).append(a.secure_url)
    cover_ids = [
        e.cover_media_id for e in events if e.cover_media_id and e.id not in photos
    ]
    covers = {
        m.id: m.secure_url for m in await media_repository.get_many(db, cover_ids) if m.secure_url
    }
    return _ReadContext(nps, users, photos, covers)


async def cover_map(db: AsyncSession, events: list[Event]) -> dict[int, str | None]:
    """{event_id: cover url} for many events in two queries.

    Used by the lightweight briefs (approval queue, dashboards) so every screen
    shows the event's real photo instead of guessing a static demo path.
    """
    ctx = await _prefetch(db, events)
    out: dict[int, str | None] = {}
    for e in events:
        urls = ctx.photos.get(e.id)
        if urls:
            out[e.id] = urls[0]
        else:
            out[e.id] = ctx.covers.get(e.cover_media_id) if e.cover_media_id else None
    return out


async def _to_read_many(
    db: AsyncSession, events: list[Event], include_photos: bool = True
) -> list[dict]:
    ctx = await _prefetch(db, events)
    return [await _to_read(db, e, include_photos=include_photos, ctx=ctx) for e in events]


async def _to_read(
    db: AsyncSession,
    event: Event,
    include_photos: bool = False,
    viewer: User | None = None,
    ctx: _ReadContext | None = None,
) -> dict:
    nonprofit = None
    np = None
    if event.nonprofit_id:
        np = (
            ctx.nonprofits.get(event.nonprofit_id)
            if ctx is not None
            else await nonprofit_repository.get_by_id(db, event.nonprofit_id)
        )
        if np:
            nonprofit = {
                "id": np.id, "name": np.name, "slug": np.slug,
                "initials": np.initials, "color": np.color, "verified": np.verified,
                "category": np.category,
            }
    organizer = None
    if event.organizer_id:
        u = (
            ctx.users.get(event.organizer_id)
            if ctx is not None
            else await user_repository.get_by_id(db, event.organizer_id)
        )
        if u:
            organizer = {
                "id": u.id, "name": u.name, "initials": u.initials, "color": u.color,
            }
    photos: list[str] = []
    if include_photos:
        if ctx is not None:
            photos = ctx.photos.get(event.id) or (
                [ctx.covers[event.cover_media_id]]
                if event.cover_media_id in ctx.covers
                else []
            )
        else:
            photos = await _resolve_photos(db, event)
    category = event.category or (np.category if np else None)
    data = {
        "id": event.id, "key": event.key, "title": event.title, "story": event.story,
        "subtitle": event.subtitle, "category": category, "kind": event.kind,
        "status": event.status, "visibility": event.visibility, "date": event.date,
        "start_time": event.start_time, "end_time": event.end_time,
        "location": event.location, "wizard_step": event.wizard_step,
        "is_live": event.is_live,
        "cover_media_id": event.cover_media_id, "cover_focus": event.cover_focus,
        "backed": event.backed,
        "joined": event.joined, "updates": event.updates,
        "chat_count": event.chat_count, "raised": event.raised,
        "nonprofit": nonprofit, "organizer": organizer,
        "tags": [t.tag for t in event.tags], "photos": photos,
        "viewer_joined": False,
        "viewer_liked": False,
        "viewer_saved": False,
        "change_request": None,
    }
    if event.status == "Changes Requested":
        review = await arepo.latest_changes_requested(db, event.id)
        if review:
            data["change_request"] = decode_change_request_note(review.note)
    if viewer is not None:
        data["viewer_joined"] = await repo.has_participation(db, event.id, viewer.id)
        data["viewer_liked"] = await repo.has_like(db, event.id, viewer.id)
        data["viewer_saved"] = await repo.has_save(db, event.id, viewer.id)
    return data


async def feed(db, category, discovery, page, limit) -> dict:
    items, total, has_more = await repo.list_feed(
        db, category=category, discovery=discovery, page=page, limit=limit
    )
    return {
        "items": await _to_read_many(db, items),
        "total": total,
        "has_more": has_more,
    }


async def get_detail(
    db: AsyncSession, key: str, viewer: User | None = None
) -> dict:
    event = await repo.get_by_key(db, key)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if event.status not in PUBLIC_DETAIL_STATUSES:
        # SE-led (and drafts) stay private until nonprofit approval publishes them Live.
        allowed = False
        if viewer is not None:
            if viewer.role == "platform_admin":
                allowed = True
            elif event.organizer_id == viewer.id:
                allowed = True
            elif (
                viewer.role == "np_admin"
                and event.nonprofit_id
                and event.status != "Draft"  # drafts are the author's private work in progress
            ):
                np = await nonprofit_repository.get_for_admin(db, viewer.id)
                if np and np.id == event.nonprofit_id:
                    allowed = True
        if not allowed:
            raise AppError("not_found", "Event not found", status_code=404)
    return await _to_read(db, event, include_photos=True, viewer=viewer)


async def _load_owned(db: AsyncSession, user: User, event_id: int) -> Event:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if event.organizer_id != user.id and user.role != "platform_admin":
        raise AppError("forbidden", "Not your event", status_code=403)
    return event


async def _resolve_category(
    db: AsyncSession, category: str | None, nonprofit_id: int | None
) -> str | None:
    """Prefer explicit category; otherwise inherit from the linked nonprofit."""
    if category and str(category).strip():
        return str(category).strip()
    if not nonprofit_id:
        return None
    np = await nonprofit_repository.get_by_id(db, nonprofit_id)
    return (np.category if np and np.category else None) or None


async def _own_nonprofit_id(db: AsyncSession, user: User) -> int | None:
    if user.role != "np_admin":
        return None
    np = await nonprofit_repository.get_for_admin(db, user.id)
    return np.id if np else None


async def _can_auto_publish(db: AsyncSession, user: User, event: Event) -> bool:
    """NP-led auto-publish only when the organizer's own nonprofit is the beneficiary."""
    own_id = await _own_nonprofit_id(db, user)
    return bool(own_id and event.nonprofit_id == own_id)


async def list_mine(
    db: AsyncSession,
    user: User,
    statuses: list[str] | None = None,
) -> dict:
    effective = statuses or ["Draft", "Changes Requested"]
    items = await repo.list_by_organizer(db, user.id, statuses=effective)
    return {
        "items": await _to_read_many(db, items),
        "total": len(items),
        "has_more": False,
    }


async def create_draft(db: AsyncSession, user: User, data: dict) -> dict:
    tags = data.pop("tags", None)
    title = data.get("title") or _derive_title(data.get("story"))
    key = await _unique_key(db, _slugify(title.lstrip("#")))
    nonprofit_id = data.get("nonprofit_id")
    own_np_id = await _own_nonprofit_id(db, user)
    if nonprofit_id is None and own_np_id is not None:
        nonprofit_id = own_np_id
    # Own-org NP drafts are NP-led; SE or partner-NP drafts need that nonprofit's approval.
    kind = "NP-led" if (own_np_id and nonprofit_id == own_np_id) else "SE-led"
    category = await _resolve_category(db, data.get("category"), nonprofit_id)
    event = await repo.create(
        db,
        key=key,
        title=title,
        story=data.get("story"),
        subtitle=data.get("story"),
        nonprofit_id=nonprofit_id,
        organizer_id=user.id,
        category=category,
        kind=kind,
        status="Draft",
        visibility=data.get("visibility") or "public",
        date=data.get("date"),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        location=data.get("location"),
        wizard_step=data.get("wizard_step"),
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
    if "nonprofit_id" in fields:
        own_np_id = await _own_nonprofit_id(db, user)
        fields["kind"] = (
            "NP-led" if (own_np_id and fields["nonprofit_id"] == own_np_id) else "SE-led"
        )
    nonprofit_id = fields.get("nonprofit_id", event.nonprofit_id)
    category_in = fields.get("category", event.category)
    resolved = await _resolve_category(db, category_in, nonprofit_id)
    if resolved and resolved != event.category:
        fields["category"] = resolved
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
    if await _can_auto_publish(db, user, event):
        # Own-org NP event: nonprofit is the publisher — auto-publish.
        event = await repo.update(
            db, event, status="Live", is_live=True, kind="NP-led"
        )
    else:
        # SE or partner-NP: beneficiary nonprofit must approve before Live.
        if not event.nonprofit_id:
            raise AppError(
                "validation_error",
                "Select a nonprofit before submitting for approval",
                status_code=422,
            )
        event = await repo.update(
            db, event, status="Submitted", is_live=False, kind="SE-led"
        )
        for admin_id in await nonprofit_repository.admin_user_ids(db, event.nonprofit_id):
            await notification_repository.create(
                db, admin_id, "approval_requested",
                f"New event '{event.title}' is waiting for your approval.",
            )
    return await _to_read(db, event, include_photos=True)


async def go_live(db: AsyncSession, user: User, event_id: int) -> dict:
    """Publish an own-org NP event directly.

    SE-led and partner events have no manual publish step: the nonprofit's
    approval (approval_service.approve) publishes them in a single step.
    """
    event = await _load_owned(db, user, event_id)
    if event.status == "Draft" and await _can_auto_publish(db, user, event):
        event = await repo.update(db, event, status="Live", is_live=True, kind="NP-led")
        return await _to_read(db, event, include_photos=True)
    raise AppError(
        "invalid_state",
        "Nonprofit approval is required before this event can go live",
        status_code=409,
    )


async def complete(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_owned(db, user, event_id)
    if event.status != "Live":
        raise AppError(
            "invalid_state", f"Cannot complete from '{event.status}'", status_code=409
        )
    event = await repo.update(db, event, status="Completed", is_live=False)
    return await _to_read(db, event, include_photos=True)


def _require_live_event(event: Event) -> None:
    if event.status != "Live" or not event.is_live:
        raise AppError(
            "invalid_state",
            "This event is not live yet",
            status_code=409,
        )


async def join(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    _require_live_event(event)
    added = await repo.add_participation(db, event_id, user.id)
    if added:
        await repo.update(db, event, joined=event.joined + 1)
    count = await repo.count_participants(db, event_id)
    return {"joined": True, "count": count}


async def like(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    _require_live_event(event)
    liked = await repo.toggle_like(db, event_id, user.id)
    return {"liked": liked}


async def save(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await repo.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    _require_live_event(event)
    saved = await repo.toggle_save(db, event_id, user.id)
    return {"saved": saved}


async def backers(db: AsyncSession, key: str) -> list:
    event = await repo.get_by_key(db, key)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    donations = await donation_repository.list_successful_by_event(db, event.id)
    return [
        {
            "id": d.id,
            "public_name": d.public_name,
            "amount": round(d.donation_cents / 100, 2),
        }
        for d in donations
    ]
