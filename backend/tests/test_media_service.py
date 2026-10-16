import pytest

from app.core.exceptions import AppError
from app.integrations import cloudinary as cl
from app.services import media_service
from tests.helpers import cloud_url


def _kw(public_id, **over):
    kw = dict(
        public_id=public_id, secure_url=cloud_url(public_id), resource_type="image",
        format="jpg", bytes=1000,
    )
    kw.update(over)
    return kw


@pytest.mark.asyncio
async def test_create_asset_valid(db_session, make_user):
    user = await make_user(email="m1@e.com")
    m = await media_service.create_asset(
        db_session, user, **_kw("avatars/p", entity_type="avatar", entity_id=user.id)
    )
    assert m.id is not None
    assert m.owner_id == user.id


@pytest.mark.asyncio
async def test_avatar_must_be_own_user(db_session, make_user):
    user = await make_user(email="m1b@e.com")
    other = await make_user(email="m1c@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, **_kw("avatars/q", entity_type="avatar", entity_id=other.id)
        )
    assert e.value.status_code == 403


@pytest.mark.asyncio
async def test_create_asset_bad_resource_type(db_session, make_user):
    user = await make_user(email="m2@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, **_kw("chat/p", resource_type="audio", format="mp3", bytes=1)
        )
    assert e.value.status_code == 400
    assert e.value.code == "unsupported_resource_type"


@pytest.mark.asyncio
async def test_create_asset_unsupported_format(db_session, make_user):
    user = await make_user(email="m3@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(db_session, user, **_kw("chat/p", format="tiff", bytes=1))
    assert e.value.code == "unsupported_format"


@pytest.mark.asyncio
async def test_create_asset_too_large(db_session, make_user):
    user = await make_user(email="m4@e.com")
    with pytest.raises(AppError) as e:
        await media_service.create_asset(
            db_session, user, **_kw("chat/p", bytes=11 * 1024 * 1024)
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
    m = await media_service.create_asset(db_session, user, **_kw("chat/pid5"))
    await media_service.delete_asset(db_session, user, m.id)
    assert called["public_id"] == "chat/pid5"
    with pytest.raises(AppError):
        await media_service.get_asset(db_session, m.id)


@pytest.mark.asyncio
async def test_delete_asset_forbidden_for_non_owner(db_session, make_user, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    owner = await make_user(email="owner@e.com")
    other = await make_user(email="other@e.com")
    m = await media_service.create_asset(db_session, owner, **_kw("chat/pid6"))
    with pytest.raises(AppError) as e:
        await media_service.delete_asset(db_session, other, m.id)
    assert e.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_asset_admin_allowed(db_session, make_user, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    owner = await make_user(email="owner2@e.com")
    admin = await make_user(role="platform_admin", email="admin@e.com")
    m = await media_service.create_asset(db_session, owner, **_kw("chat/pid7"))
    await media_service.delete_asset(db_session, admin, m.id)
    with pytest.raises(AppError):
        await media_service.get_asset(db_session, m.id)
