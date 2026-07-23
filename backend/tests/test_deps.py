import pytest
from starlette.requests import Request

from app.api.deps import (
    get_current_user,
    get_current_user_optional,
    require_role,
)
from app.core.exceptions import AppError
from app.core.security import create_access_token, create_refresh_token


def _request(headers: dict) -> Request:
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_get_current_user_happy(db_session, make_user):
    user = await make_user(role="se", email="d1@e.com")
    req = _request({"Authorization": f"Bearer {create_access_token(str(user.id))}"})
    resolved = await get_current_user(req, db_session)
    assert resolved.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_missing_header_401(db_session):
    with pytest.raises(AppError) as exc:
        await get_current_user(_request({}), db_session)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_rejects_refresh_token(db_session, make_user):
    user = await make_user(email="d2@e.com")
    req = _request({"Authorization": f"Bearer {create_refresh_token(str(user.id))}"})
    with pytest.raises(AppError) as exc:
        await get_current_user(req, db_session)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_optional_returns_none(db_session):
    assert await get_current_user_optional(_request({}), db_session) is None
    bad = _request({"Authorization": "Bearer garbage"})
    assert await get_current_user_optional(bad, db_session) is None


@pytest.mark.asyncio
async def test_require_role_allows_and_blocks(make_user):
    se_user = await make_user(role="se", email="d3@e.com")
    dep = require_role("se", "platform_admin")
    assert (await dep(user=se_user)).id == se_user.id

    guest = await make_user(role="guest_lead", email="d4@e.com", password=None)
    with pytest.raises(AppError) as exc:
        await dep(user=guest)
    assert exc.value.status_code == 403
