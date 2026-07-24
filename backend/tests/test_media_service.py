import pytest

from app.core.exceptions import AppError
from app.integrations import cloudinary as cl
from app.services import media_service


@pytest.mark.asyncio
async def test_create_asset_valid(db_session, make_user):
    user = await make_user(email="m1@e.com")
    m = await media_service.create_asset(
        db_session,
        user,
        public_id="p",
        secure_url="https://x/p.jpg",
        resource_type="image",
        format="jpg",
        bytes=1000,
        entity_type="avatar",
    )
    assert m.id is not None
    assert m.owner_id == user.id


@pytest.mark.asyncio
async def test_create_asset_bad_resource_type(db_session, make_user):
    user = await make_user(email="m2@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, public_id="p", secure_url="u",
            resource_type="audio", format="mp3", bytes=1,
        )
    assert e.value.status_code == 400
    assert e.value.code == "unsupported_resource_type"


@pytest.mark.asyncio
async def test_create_asset_unsupported_format(db_session, make_user):
    user = await make_user(email="m3@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, public_id="p", secure_url="u",
            resource_type="image", format="tiff", bytes=1,
        )
    assert e.value.code == "unsupported_format"


@pytest.mark.asyncio
async def test_create_asset_too_large(db_session, make_user):
    user = await make_user(email="m4@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, public_id="p", secure_url="u",
            resource_type="image", format="jpg", bytes=11 * 1024 * 1024,
        )
    assert e.value.code == "file_too_large"


@pytest.mark.asyncio
async def test_get_asset_404(db_session):
    with pytest.raises(AppError) as e:
        await media_service.get_asset(db_session, 999)
    assert e.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_asset_owner(db_session, make_user, monkeypatch):
    called = {}

    def fake_destroy(public_id, resource_type="image"):
        called["public_id"] = public_id
        return {"result": "ok"}

    monkeypatch.setattr(cl, "destroy", fake_destroy)
    user = await make_user(email="m5@e.com")
    m = await media_service.create_asset(
        db_session, user, public_id="pid5", secure_url="u",
        resource_type="image", format="jpg", bytes=1000,
    )
    await media_service.delete_asset(db_session, user, m.id)
    assert called["public_id"] == "pid5"
    with pytest.raises(AppError):
        await media_service.get_asset(db_session, m.id)


@pytest.mark.asyncio
async def test_delete_asset_forbidden_for_non_owner(db_session, make_user, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    owner = await make_user(email="owner@e.com")
    other = await make_user(email="other@e.com")
    m = await media_service.create_asset(
        db_session, owner, public_id="pid6", secure_url="u",
        resource_type="image", format="jpg", bytes=1000,
    )
    with pytest.raises(AppError) as e:
        await media_service.delete_asset(db_session, other, m.id)
    assert e.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_asset_admin_allowed(db_session, make_user, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    owner = await make_user(email="owner2@e.com")
    admin = await make_user(role="platform_admin", email="admin@e.com")
    m = await media_service.create_asset(
        db_session, owner, public_id="pid7", secure_url="u",
        resource_type="image", format="jpg", bytes=1000,
    )
    await media_service.delete_asset(db_session, admin, m.id)
    with pytest.raises(AppError):
        await media_service.get_asset(db_session, m.id)
