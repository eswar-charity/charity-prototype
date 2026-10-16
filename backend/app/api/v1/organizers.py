from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services import user_service

router = APIRouter(tags=["users"])


@router.get("/organizers/{user_id}")
async def organizer_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    """Public profile of an event organizer (name, bio, city, causes — nothing private)."""
    return await user_service.get_public_organizer(db, user_id)
