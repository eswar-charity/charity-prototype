from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.event import Event
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import (
    approval_repository as arepo,
    event_repository,
    nonprofit_repository,
    notification_repository,
    user_repository,
)
from app.services import event_service
from app.utils.change_request_note import VALID_AREAS, encode_change_request_note

REVIEWABLE = ("Submitted", "Changes Requested")


async def _my_nonprofit(db: AsyncSession, user: User) -> Nonprofit:
    np = await nonprofit_repository.get_for_admin(db, user.id)
    if not np:
        raise AppError(
            "not_found", "No nonprofit is linked to this account", status_code=404
        )
    return np


def _event_brief(event: Event, organizers: dict, covers: dict) -> dict:
    return {
        "id": event.id,
        "key": event.key,
        "title": event.title,
        "organizer": organizers.get(event.organizer_id),
        "date": event.date,
        "location": event.location,
        "story": event.story,
        "status": event.status,
        "cover": covers.get(event.id),
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }


async def list_queue(db: AsyncSession, user: User) -> list[dict]:
    np = await _my_nonprofit(db, user)
    events = await arepo.list_queue(db, np.id)
    users = await user_repository.get_many(
        db, list({e.organizer_id for e in events if e.organizer_id})
    )
    organizers = {u.id: u.name for u in users}
    covers = await event_service.cover_map(db, events)
    return [_event_brief(e, organizers, covers) for e in events]


async def _load_for_review(db: AsyncSession, user: User, event_id: int) -> Event:
    np = await _my_nonprofit(db, user)
    event = await event_repository.get_by_id(db, event_id)
    # A Draft hasn't been submitted to the nonprofit yet; it is not theirs to see or decide.
    if not event or event.nonprofit_id != np.id or event.status == "Draft":
        raise AppError("not_found", "Event not found for your nonprofit", status_code=404)
    return event


async def review_detail(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_for_review(db, user, event_id)
    return await event_service._to_read(db, event, include_photos=True)


async def approve(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await _load_for_review(db, user, event_id)
    if event.status not in REVIEWABLE:
        raise AppError("invalid_state", f"Cannot approve from '{event.status}'", status_code=409)
    # Nonprofit approval is the mandatory gate; SE-led events publish only after this.
    event = await event_repository.update(db, event, status="Live", is_live=True)
    await arepo.add_review(db, event.id, user.id, "approved")
    if event.organizer_id:
        await notification_repository.create(
            db, event.organizer_id, "event_approved",
            f"Your event '{event.title}' was approved and is now live.",
        )
    return await event_service._to_read(db, event, include_photos=True)


async def reject(db: AsyncSession, user: User, event_id: int, reason: str) -> dict:
    event = await _load_for_review(db, user, event_id)
    if event.status not in REVIEWABLE:
        raise AppError("invalid_state", f"Cannot reject from '{event.status}'", status_code=409)
    event = await event_repository.update(db, event, status="Rejected", is_live=False)
    await arepo.add_review(db, event.id, user.id, "rejected", note=reason)
    if event.organizer_id:
        await notification_repository.create(
            db, event.organizer_id, "event_rejected",
            f"Your event '{event.title}' was rejected: {reason}",
        )
    return await event_service._to_read(db, event, include_photos=True)


async def request_changes(
    db: AsyncSession,
    user: User,
    event_id: int,
    feedback: str,
    areas: list[str] | None = None,
) -> dict:
    event = await _load_for_review(db, user, event_id)
    if event.status not in REVIEWABLE:
        raise AppError("invalid_state", f"Cannot request changes from '{event.status}'", status_code=409)
    clean_areas = [a for a in (areas or []) if a in VALID_AREAS]
    if not clean_areas:
        raise AppError(
            "validation_error",
            "Select at least one area for the organizer to update",
            status_code=422,
        )
    note = encode_change_request_note(feedback, clean_areas)
    event = await event_repository.update(db, event, status="Changes Requested")
    await arepo.add_review(db, event.id, user.id, "changes_requested", note=note)
    if event.organizer_id:
        await notification_repository.create(
            db, event.organizer_id, "changes_requested",
            f"Changes requested on '{event.title}': {feedback}",
        )
    return await event_service._to_read(db, event, include_photos=True)


async def get_autopilot(db: AsyncSession, user: User) -> dict:
    np = await _my_nonprofit(db, user)
    ap = await arepo.get_autopilot(db, np.id)
    trusted = await arepo.list_trusted(db, np.id)
    trusted_out = []
    for t in trusted:
        u = await user_repository.get_by_id(db, t.se_user_id)
        trusted_out.append(
            {"se_user_id": t.se_user_id, "name": u.name if u else None,
             "initials": u.initials if u else None}
        )
    return {
        "enabled": ap.enabled if ap else False,
        "checks": (ap.checks if ap else None) or [],
        "trusted_ses": trusted_out,
    }


async def update_autopilot(
    db: AsyncSession, user: User, enabled: bool | None, checks: list | None
) -> dict:
    np = await _my_nonprofit(db, user)
    await arepo.upsert_autopilot(db, np.id, enabled, checks)
    return await get_autopilot(db, user)


async def add_trusted(db: AsyncSession, user: User, se_user_id: int) -> dict:
    np = await _my_nonprofit(db, user)
    target = await user_repository.get_by_id(db, se_user_id)
    if not target or target.role != "se":
        raise AppError("invalid_request", "Trusted SE must be an existing SE user", status_code=400)
    await arepo.add_trusted(db, np.id, se_user_id)
    return await get_autopilot(db, user)


async def remove_trusted(db: AsyncSession, user: User, se_user_id: int) -> dict:
    np = await _my_nonprofit(db, user)
    await arepo.remove_trusted(db, np.id, se_user_id)
    return await get_autopilot(db, user)
