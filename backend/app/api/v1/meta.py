from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services import meta_service

router = APIRouter(tags=["meta"])


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Public cause taxonomy (feed filters, wizard picker, profile interests)."""
    return await meta_service.list_categories(db)


@router.get("/causes")
async def causes(db: AsyncSession = Depends(get_db)):
    """Public: categories that have events, with counts and a featured event."""
    return await meta_service.causes(db)
