from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.models.attendee import Attendee
from app.models.event import Event
from app.models.user import User
from app.repositories import (
    attendee_repository,
    donation_repository,
    event_repository,
    nonprofit_repository,
    user_repository,
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
        "ticket_code": a.ticket_code,
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


async def can_staff_event(db: AsyncSession, user: User, event: Event) -> bool:
    """Organizer, the event's own nonprofit admin, or a platform admin."""
    if user.role == "platform_admin":
        return True
    if event.organizer_id == user.id:
        return True
    if user.role == "np_admin" and event.nonprofit_id:
        np = await nonprofit_repository.get_for_admin(db, user.id)
        return bool(np and np.id == event.nonprofit_id)
    return False


async def _event_for_staff(db: AsyncSession, user: User, event_id: int) -> Event:
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if not await can_staff_event(db, user, event):
        raise AppError("forbidden", "Not allowed to manage check-in", status_code=403)
    return event


async def my_ticket(db: AsyncSession, user: User, event_id: int) -> dict:
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    part = await event_repository.get_participation(db, event_id, user.id)
    if part is None:
        raise AppError(
            "forbidden", "Join this event to get a ticket", status_code=403
        )
    return {
        "event_id": event.id,
        "event_key": event.key,
        "title": event.title,
        "code": part.ticket_code,
        "holder": user.name,
    }


async def check_in(
    db: AsyncSession, user: User, event_id: int, *, name: str | None = None,
    ticket_type: str | None = None, backed: bool = False, code: str | None = None,
) -> dict:
    event = await _event_for_staff(db, user, event_id)

    if code:
        code = code.strip().upper()
        part = await event_repository.get_participation_by_ticket(db, event.id, code)
        if part is None:
            raise AppError(
                "invalid_ticket", "Ticket not recognised for this event", status_code=404
            )
        existing = await attendee_repository.get_by_ticket(db, event.id, code)
        if existing is not None:
            raise AppError(
                "already_checked_in",
                f"{existing.name} is already checked in",
                status_code=409,
                details=_attendee_read(existing),
            )
        holder = await user_repository.get_by_id(db, part.user_id)
        holder_name = holder.name if holder else "Guest"
        donated = await donation_repository.has_successful(db, event.id, part.user_id)
        return _attendee_read(
            await attendee_repository.create(
                db, event_id=event.id, user_id=part.user_id, name=holder_name,
                initials=derive_initials(holder_name), color=pick_color(holder_name),
                ticket_type="Backer" if donated else "General admission",
                backed=donated, ticket_code=code,
            )
        )

    if not name or not name.strip():
        raise AppError(
            "validation_error", "Provide a ticket code or a name", status_code=422
        )
    return _attendee_read(
        await attendee_repository.create(
            db, event_id=event.id, name=name.strip(), initials=derive_initials(name),
            color=pick_color(name), ticket_type=ticket_type or "Walk-in", backed=backed,
        )
    )


async def list_attendees(db: AsyncSession, user: User, event_id: int) -> list[dict]:
    await _event_for_staff(db, user, event_id)
    attendees = await attendee_repository.list_by_event(db, event_id)
    return [_attendee_read(a) for a in attendees]
