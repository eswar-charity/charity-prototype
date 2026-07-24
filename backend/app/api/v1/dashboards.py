from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.user import User
from app.repositories import notification_repository
from app.services import dashboard_service

router = APIRouter(tags=["dashboards"])


# --- Notifications ---
@router.get("/me/notifications")
async def my_notifications(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    items = await notification_repository.list_for_user(db, user.id)
    return [
        {"id": n.id, "type": n.type, "text": n.text, "read": n.read,
         "created_at": n.created_at.isoformat()}
        for n in items
    ]


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    n = await notification_repository.get_by_id(db, notification_id)
    if not n or n.user_id != user.id:
        raise AppError("not_found", "Notification not found", status_code=404)
    n = await notification_repository.mark_read(db, n)
    return {"id": n.id, "read": n.read}


# --- Nonprofit dashboards ---
@router.get("/np/launchpad")
async def np_launchpad(
    user: User = Depends(require_role("np_admin")), db: AsyncSession = Depends(get_db)
):
    return await dashboard_service.np_launchpad(db, user)


@router.get("/np/activity")
async def np_activity(
    user: User = Depends(require_role("np_admin")), db: AsyncSession = Depends(get_db)
):
    return await dashboard_service.np_activity(db, user)


@router.get("/np/financials")
async def np_financials(
    user: User = Depends(require_role("np_admin")), db: AsyncSession = Depends(get_db)
):
    return await dashboard_service.np_financials(db, user)


# --- SE dashboards ---
@router.get("/se/live-dashboard/{key}")
async def se_live_dashboard(
    key: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await dashboard_service.se_live_dashboard(db, user, key)


@router.get("/se/post-event/{key}")
async def se_post_event(
    key: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await dashboard_service.se_post_event(db, user, key)
