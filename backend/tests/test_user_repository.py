import pytest

from app.repositories import user_repository


@pytest.mark.asyncio
async def test_create_and_get_by_id_email_phone(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="a@example.com",
        phone="+15550001",
        password_hash="h",
        name="Ada Lovelace",
        initials="AL",
        color="#C62828",
        status="active",
    )
    assert user.id is not None
    assert (await user_repository.get_by_id(db_session, user.id)).email == "a@example.com"
    assert (await user_repository.get_by_email(db_session, "a@example.com")).id == user.id
    assert (await user_repository.get_by_phone(db_session, "+15550001")).id == user.id
    assert await user_repository.get_by_email(db_session, "missing@example.com") is None


@pytest.mark.asyncio
async def test_update_fields(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="b@example.com",
        password_hash="h",
        name="Grace Hopper",
        initials="GH",
        color="#7C3AED",
        status="active",
    )
    updated = await user_repository.update(db_session, user, bio="Hello", city="NYC")
    assert updated.bio == "Hello"
    assert updated.city == "NYC"


@pytest.mark.asyncio
async def test_set_causes_replaces(db_session):
    user = await user_repository.create(
        db_session,
        role="se",
        email="c@example.com",
        password_hash="h",
        name="Cause Person",
        initials="CP",
        color="#00897B",
        status="active",
    )
    await user_repository.set_causes(db_session, user, ["Environment", "Education"])
    assert {c.cause for c in user.causes} == {"Environment", "Education"}
    await user_repository.set_causes(db_session, user, ["Health"])
    assert {c.cause for c in user.causes} == {"Health"}
