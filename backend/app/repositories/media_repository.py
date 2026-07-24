from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import MediaAsset


async def create(db: AsyncSession, **fields) -> MediaAsset:
    media = MediaAsset(**fields)
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def get_by_id(db: AsyncSession, media_id: int) -> MediaAsset | None:
    result = await db.execute(select(MediaAsset).where(MediaAsset.id == media_id))
    return result.scalar_one_or_none()


async def delete(db: AsyncSession, media: MediaAsset) -> None:
    await db.delete(media)
    await db.commit()


async def list_by_entity(
    db: AsyncSession, entity_type: str, entity_id: int
) -> list[MediaAsset]:
    result = await db.execute(
        select(MediaAsset).where(
            MediaAsset.entity_type == entity_type,
            MediaAsset.entity_id == entity_id,
        )
    )
    return list(result.scalars().all())
