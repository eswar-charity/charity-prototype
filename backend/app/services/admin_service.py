from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import (
    admin_repository as arepo,
    nonprofit_repository,
)
from app.services import invite_service

REVIEW_OPEN = ("New", "In Review", "Escalated")
NP_PENDING = ("Submitted", "Pending Verification")
SETTLEMENT_PENDING = ("Not ready", "Payout hold", "Frozen")

REVIEW_ACTIONS = {
    "approve": "Approved",
    "request-changes": "In Review",
    "escalate": "Escalated",
    "reject": "Rejected",
    "reopen": "New",
}
EXCEPTION_ACTIONS = {
    "escalate": "Escalated",
    "resolve": "Resolved",
    "reopen": "Open",
}


def _review_read(i) -> dict:
    return {
        "id": i.id, "code": i.code, "type": i.type, "title": i.title,
        "entity": i.entity_ref, "submitted_by": i.submitted_by,
        "submitted_role": i.submitted_role, "status": i.status,
        "priority": i.priority, "summary": i.summary, "checks": i.checks or [],
    }


def _exception_read(e) -> dict:
    return {
        "id": e.id, "code": e.code, "type": e.type, "title": e.title,
        "entity": e.entity_ref, "severity": e.severity, "status": e.status,
        "amount": e.amount,
    }


def _audit_read(a) -> dict:
    return {
        "id": a.id, "actor": a.actor, "role": a.role, "action": a.action,
        "target": a.target, "category": a.category, "at": a.at.isoformat(),
    }


def _np_read(np) -> dict:
    return {
        "id": np.id, "name": np.name, "slug": np.slug, "category": np.category,
        "ein": np.ein, "verified": np.verified, "status": np.status,
        "settlement_status": np.settlement_status, "source": np.source,
    }


async def dashboard(db: AsyncSession) -> dict:
    reviews = await arepo.list_reviews(db)
    exceptions = await arepo.list_exceptions(db)
    all_np = (await db.execute(select(Nonprofit))).scalars().all()
    open_exc = [e for e in exceptions if e.status != "Resolved"]
    return {
        "review_queue": len([r for r in reviews if r.status in REVIEW_OPEN]),
        "pending_verification": len([n for n in all_np if n.status in NP_PENDING]),
        "live_events": await arepo.count_live_events(db),
        "open_exceptions": len(open_exc),
        "gmv_week": await arepo.sum_raised(db),
        "payouts_pending": len([n for n in all_np if n.settlement_status in SETTLEMENT_PENDING]),
        "action_required": [_review_read(r) for r in reviews if r.status in REVIEW_OPEN][:5],
        "open_exception_items": [_exception_read(e) for e in open_exc][:5],
    }


async def list_reviews(db: AsyncSession, status: str | None) -> list[dict]:
    return [_review_read(r) for r in await arepo.list_reviews(db, status)]


async def review_detail(db: AsyncSession, review_id: int) -> dict:
    item = await arepo.get_review(db, review_id)
    if not item:
        raise AppError("not_found", "Review item not found", status_code=404)
    return _review_read(item)


async def review_action(db: AsyncSession, admin: User, review_id: int, action: str) -> dict:
    if action not in REVIEW_ACTIONS:
        raise AppError("invalid_request", f"Unknown review action '{action}'", status_code=400)
    item = await arepo.get_review(db, review_id)
    if not item:
        raise AppError("not_found", "Review item not found", status_code=404)
    item = await arepo.update_review(db, item, status=REVIEW_ACTIONS[action])
    await arepo.add_audit(
        db, admin.name, admin.role, f"Review {action}", item.title, "Approval"
    )
    return _review_read(item)


async def list_nonprofits(db: AsyncSession, status: str | None, page: int, limit: int) -> dict:
    items, total, has_more = await nonprofit_repository.list_nonprofits(
        db, category=None, verified_only=False, page=page, limit=limit
    )
    rows = [n for n in items if (status is None or n.status == status)]
    return {"items": [_np_read(n) for n in rows], "total": total, "has_more": has_more}


async def nonprofit_detail(db: AsyncSession, nonprofit_id: int) -> dict:
    np = await nonprofit_repository.get_by_id(db, nonprofit_id)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)
    return _np_read(np)


async def nonprofit_action(db: AsyncSession, admin: User, nonprofit_id: int, action: str) -> dict:
    np = await nonprofit_repository.get_by_id(db, nonprofit_id)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)
    if action == "verify":
        np = await nonprofit_repository.update(db, np, status="Active", verified=True)
    elif action == "reject":
        np = await nonprofit_repository.update(db, np, status="Rejected", verified=False)
    elif action == "suspend":
        np = await nonprofit_repository.update(db, np, status="Suspended")
    elif action == "reinstate":
        np = await nonprofit_repository.update(db, np, status="Active")
    elif action == "rerun-ein":
        # Mock EIN re-check: returns a canned source match, no status change.
        np = await nonprofit_repository.update(db, np, source="IRS BMF")
    else:
        raise AppError("invalid_request", f"Unknown nonprofit action '{action}'", status_code=400)
    await arepo.add_audit(
        db, admin.name, admin.role, f"Nonprofit {action}", np.name, "Verification"
    )
    return _np_read(np)


async def invite_nonprofit(db: AsyncSession, admin: User, name: str, category: str,
                           ein: str | None, admin_email: str | None = None) -> dict:
    slug = "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-") or "nonprofit"
    if await nonprofit_repository.get_by_slug(db, slug):
        raise AppError("conflict", "A nonprofit with this name already exists", status_code=409)
    np = await nonprofit_repository.create(
        db, name=name, slug=slug, category=category, ein=ein, verified=False,
        status="Submitted", settlement_status="Not ready",
    )
    await arepo.add_audit(db, admin.name, admin.role, "Invited nonprofit", name, "Governance")
    out = _np_read(np)
    if admin_email:
        out["invite"] = await invite_service.create_nonprofit_admin_invite(
            db, admin, np, admin_email
        )
        await arepo.add_audit(
            db, admin.name, admin.role, "Invited nonprofit admin", name, "Governance"
        )
    return out


async def invite_nonprofit_admin(db: AsyncSession, admin: User, nonprofit_id: int,
                                 email: str) -> dict:
    np = await nonprofit_repository.get_by_id(db, nonprofit_id)
    if not np:
        raise AppError("not_found", "Nonprofit not found", status_code=404)
    invite = await invite_service.create_nonprofit_admin_invite(db, admin, np, email)
    await arepo.add_audit(
        db, admin.name, admin.role, "Invited nonprofit admin", np.name, "Governance"
    )
    return invite


async def list_events(db: AsyncSession) -> list[dict]:
    events = await arepo.list_events(db)
    return [
        {"id": e.id, "key": e.key, "title": e.title, "kind": e.kind,
         "status": e.status, "joined": e.joined, "raised": e.raised}
        for e in events
    ]


async def list_exceptions(db: AsyncSession, status: str | None) -> list[dict]:
    return [_exception_read(e) for e in await arepo.list_exceptions(db, status)]


async def exception_action(db: AsyncSession, admin: User, exc_id: int, action: str) -> dict:
    if action not in EXCEPTION_ACTIONS:
        raise AppError("invalid_request", f"Unknown exception action '{action}'", status_code=400)
    exc = await arepo.get_exception(db, exc_id)
    if not exc:
        raise AppError("not_found", "Exception not found", status_code=404)
    exc = await arepo.update_exception(db, exc, status=EXCEPTION_ACTIONS[action])
    await arepo.add_audit(db, admin.name, admin.role, f"Exception {action}", exc.title, "Exception")
    return _exception_read(exc)


async def list_audit(db: AsyncSession, category: str | None) -> list[dict]:
    return [_audit_read(a) for a in await arepo.list_audit(db, category)]
