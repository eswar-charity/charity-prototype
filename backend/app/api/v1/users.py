from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import ProfileUpdateRequest, UserRead
from app.services import user_service

router = APIRouter(prefix="/me", tags=["users"])


@router.get("/profile", response_model=UserRead)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.update_profile(
        db,
        user,
        name=payload.name,
        bio=payload.bio,
        city=payload.city,
        causes=payload.causes,
        avatar_media_id=payload.avatar_media_id,
    )
