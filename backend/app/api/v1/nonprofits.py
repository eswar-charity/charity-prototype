from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.nonprofit import (
    NonprofitListResponse,
    NonprofitProfileResponse,
    NonprofitProfileUpdate,
    NonprofitRead,
)
from app.services import nonprofit_service

router = APIRouter(tags=["nonprofits"])


@router.get("/nonprofits", response_model=NonprofitListResponse)
async def list_nonprofits(
    search: str | None = None,
    category: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await nonprofit_service.list_nonprofits(
        db, search, category, False, page, limit
    )


@router.get("/nonprofits/{slug}", response_model=NonprofitProfileResponse)
async def nonprofit_profile(slug: str, db: AsyncSession = Depends(get_db)):
    return await nonprofit_service.get_public_profile(db, slug)


@router.get("/np/profile", response_model=NonprofitRead)
async def my_nonprofit_profile(
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await nonprofit_service.get_my_profile(db, user)


@router.patch("/np/profile", response_model=NonprofitRead)
async def update_my_nonprofit_profile(
    payload: NonprofitProfileUpdate,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await nonprofit_service.update_profile(db, user, **payload.model_dump())
