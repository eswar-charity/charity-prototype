from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.media import (
    MediaCreateRequest,
    MediaRead,
    SignRequest,
    SignResponse,
)
from app.services import media_service

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/sign", response_model=SignResponse)
async def sign(payload: SignRequest, user: User = Depends(get_current_user)):
    return media_service.sign_upload(payload.folder, payload.resource_type)


@router.post("", response_model=MediaRead, status_code=201)
async def create(
    payload: MediaCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await media_service.create_asset(db, user, **payload.model_dump())


@router.get("/{media_id}", response_model=MediaRead)
async def get_one(media_id: int, db: AsyncSession = Depends(get_db)):
    return await media_service.get_asset(db, media_id)


@router.delete("/{media_id}")
async def delete_one(
    media_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await media_service.delete_asset(db, user, media_id)
    return {"status": "ok"}
