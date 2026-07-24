import pytest
from sqlalchemy import select

from app.models.enums import MediaEntityType, ResourceType
from app.models.media import MediaAsset


def test_media_enums():
    assert ResourceType.image == "image"
    assert ResourceType.video == "video"
    assert set(ResourceType) == {ResourceType.image, ResourceType.video}
    assert MediaEntityType.avatar == "avatar"
    assert MediaEntityType.event_photo == "event_photo"


@pytest.mark.asyncio
async def test_persist_media_asset(db_session):
    m = MediaAsset(
        public_id="charity/ev1",
        secure_url="https://res.cloudinary.com/demo/image/upload/ev1.jpg",
        resource_type="image",
        format="jpg",
        bytes=1234,
        width=800,
        height=600,
        entity_type="event_photo",
        entity_id=5,
    )
    db_session.add(m)
    await db_session.commit()

    fetched = (
        await db_session.execute(
            select(MediaAsset).where(MediaAsset.public_id == "charity/ev1")
        )
    ).scalar_one()
    assert fetched.id is not None
    assert fetched.owner_id is None
    assert fetched.resource_type == "image"
    assert fetched.entity_type == "event_photo"
    assert fetched.entity_id == 5
