from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.event import Event
from app.models.user import User
from app.repositories import event_repository, feed_repository, nonprofit_repository
from app.services import qr_service

PENDING = ("Submitted", "Changes Requested")


async def _my_nonprofit(db: AsyncSession, user: User):
    np = await nonprofit_repository.get_for_admin(db, user.id)
    if not np:
        raise AppError("not_found", "No nonprofit is linked to this account", status_code=404)
    return np


def _event_brief(e: Event) -> dict:
    return {
        "id": e.id, "key": e.key, "title": e.title, "status": e.status,
        "is_live": e.is_live, "joined": e.joined, "backed": e.backed,
        "raised": e.raised, "updates": e.updates,
    }


def _nonprofit_brief(np) -> dict:
    return {
        "id": np.id, "name": np.name, "slug": np.slug, "verified": np.verified,
        "initials": np.initials, "color": np.color,
        "settlement_status": np.settlement_status,
    }


async def np_launchpad(db: AsyncSession, user: User) -> dict:
    np = await _my_nonprofit(db, user)
    events = await event_repository.list_by_nonprofit(db, np.id)
    live = [e for e in events if e.status == "Live"]
    pending = [e for e in events if e.status in PENDING]
    backers = sum(e.backed for e in events)
    return {
        "org": _nonprofit_brief(np),
        "stats": {
            "live_events": len(live),
            "pending_approvals": len(pending),
            "backers": backers,
        },
        "live_events": [_event_brief(e) for e in live],
        "action_required": [
            {"id": e.id, "title": e.title, "status": e.status,
             "kind": "approval"} for e in pending
        ],
    }


async def np_activity(db: AsyncSession, user: User) -> dict:
    np = await _my_nonprofit(db, user)
    events = await event_repository.list_by_nonprofit(db, np.id)
    return {
        "supporters": sum(e.backed for e in events),
        "total_raised": sum(e.raised for e in events),
        "backing_by_event": [
            {"id": e.id, "title": e.title, "count": e.backed, "raised": e.raised}
            for e in events
        ],
        "settlement": {"status": np.settlement_status, "connected": bool(np.stripe_charges_enabled)},
    }


async def np_financials(db: AsyncSession, user: User) -> dict:
    np = await _my_nonprofit(db, user)
    events = await event_repository.list_by_nonprofit(db, np.id)
    return {
        "total_raised": sum(e.raised for e in events),
        "supporters": sum(e.backed for e in events),
        "settlement_status": np.settlement_status,
        "revenue_by_event": [
            {"id": e.id, "title": e.title, "raised": e.raised} for e in events
        ],
    }


async def _owned_event(db: AsyncSession, user: User, key: str) -> Event:
    event = await event_repository.get_by_key(db, key)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if not await qr_service.can_staff_event(db, user, event):
        raise AppError("forbidden", "Not your event", status_code=403)
    return event


async def se_live_dashboard(db: AsyncSession, user: User, key: str) -> dict:
    event = await _owned_event(db, user, key)
    posts, _total, _hm = await feed_repository.list_posts(db, event.id, page=1, limit=5)
    return {
        "event": _event_brief(event),
        "stats": {
            "joined": event.joined, "backed": event.backed, "raised": event.raised,
            "updates": event.updates, "chat_count": event.chat_count,
        },
        "recent_updates": [
            {"id": p.id, "text": p.text, "created_at": p.created_at.isoformat()}
            for p in posts
        ],
    }


async def se_post_event(db: AsyncSession, user: User, key: str) -> dict:
    event = await _owned_event(db, user, key)
    return {
        "event": _event_brief(event),
        "impact": {
            "raised": event.raised, "backers": event.backed,
            "participants": event.joined, "updates": event.updates,
        },
    }
