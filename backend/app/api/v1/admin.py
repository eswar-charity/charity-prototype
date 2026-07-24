from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import InviteNonprofitRequest
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def dashboard(
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.dashboard(db)


@router.get("/review")
async def list_reviews(
    status: str | None = None,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.list_reviews(db, status)


@router.get("/review/{review_id}")
async def review_detail(
    review_id: int,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.review_detail(db, review_id)


@router.post("/review/{review_id}/{action}")
async def review_action(
    review_id: int,
    action: str,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.review_action(db, user, review_id, action)


@router.get("/nonprofits")
async def list_nonprofits(
    status: str | None = None,
    page: int = 1,
    limit: int = 50,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.list_nonprofits(db, status, page, limit)


@router.post("/nonprofits/invite")
async def invite_nonprofit(
    payload: InviteNonprofitRequest,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.invite_nonprofit(db, user, payload.name, payload.category, payload.ein)


@router.get("/nonprofits/{nonprofit_id}")
async def nonprofit_detail(
    nonprofit_id: int,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.nonprofit_detail(db, nonprofit_id)


@router.post("/nonprofits/{nonprofit_id}/{action}")
async def nonprofit_action(
    nonprofit_id: int,
    action: str,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.nonprofit_action(db, user, nonprofit_id, action)


@router.get("/events")
async def list_events(
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.list_events(db)


@router.get("/exceptions")
async def list_exceptions(
    status: str | None = None,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.list_exceptions(db, status)


@router.post("/exceptions/{exc_id}/{action}")
async def exception_action(
    exc_id: int,
    action: str,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.exception_action(db, user, exc_id, action)


@router.get("/audit")
async def list_audit(
    category: str | None = None,
    user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.list_audit(db, category)
