from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.models.attendee import Attendee
from app.models.user import User
from app.repositories import (
    attendee_repository,
    event_repository,
    nonprofit_repository,
)
from app.utils.identity import derive_initials, pick_color


def _link(path: str) -> str:
    return f"{get_settings().public_base_url.rstrip('/')}{path}"


def _attendee_read(a: Attendee) -> dict:
    return {
        "id": a.id,
        "name": a.name,
        "initials": a.initials,
        "color": a.color,
        "ticket_type": a.ticket_type,
        "backed": a.backed,
        "checked_in_at": a.checked_in_at.isoformat() if a.checked_in_at else None,
    }


async def event_qr(db: AsyncSession, event_id: int) -> dict:
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    return {"url": _link(f"/guest/event/live/{event.key}"), "event_key": event.key}


async def nonprofit_qr(db: AsyncSession, nonprofit_id: int) -> dict:
    np = await nonprofit_repository.get_by_id(db, nonprofit_id)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)
    return {"url": _link(f"/guest/np/{np.slug}"), "slug": np.slug}


async def _event_for_staff(db: AsyncSession, user: User, event_id: int):
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if event.organizer_id != user.id and user.role not in ("np_admin", "platform_admin"):
        raise AppError("forbidden", "Not allowed to manage check-in", status_code=403)
    return event


async def check_in(
    db: AsyncSession, user: User, event_id: int, *, name: str,
    ticket_type: str | None = None, backed: bool = False,
) -> dict:
    await _event_for_staff(db, user, event_id)
    attendee = await attendee_repository.create(
        db, event_id=event_id, name=name, initials=derive_initials(name),
        color=pick_color(name), ticket_type=ticket_type, backed=backed,
    )
    return _attendee_read(attendee)


async def list_attendees(db: AsyncSession, user: User, event_id: int) -> list[dict]:
    await _event_for_staff(db, user, event_id)
    attendees = await attendee_repository.list_by_event(db, event_id)
    return [_attendee_read(a) for a in attendees]
