import pytest

from app.repositories import media_repository


async def _mk(db, public_id="p1", entity_type="event_photo", entity_id=1, owner_id=None):
    return await media_repository.create(
        db,
        public_id=public_id,
        secure_url=f"https://res.cloudinary.com/demo/image/upload/{public_id}.jpg",
        resource_type="image",
        format="jpg",
        bytes=100,
        width=None,
        height=None,
        owner_id=owner_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@pytest.mark.asyncio
async def test_create_and_get(db_session):
    a = await _mk(db_session)
    assert a.id is not None
    assert (await media_repository.get_by_id(db_session, a.id)).public_id == "p1"
    assert await media_repository.get_by_id(db_session, 9999) is None


@pytest.mark.asyncio
async def test_delete(db_session):
    a = await _mk(db_session, public_id="p2")
    await media_repository.delete(db_session, a)
    assert await media_repository.get_by_id(db_session, a.id) is None


@pytest.mark.asyncio
async def test_list_by_entity(db_session):
    await _mk(db_session, public_id="e1", entity_type="event_photo", entity_id=7)
    await _mk(db_session, public_id="e2", entity_type="event_photo", entity_id=7)
    await _mk(db_session, public_id="o1", entity_type="event_photo", entity_id=8)
    rows = await media_repository.list_by_entity(db_session, "event_photo", 7)
    assert {r.public_id for r in rows} == {"e1", "e2"}
