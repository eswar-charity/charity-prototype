import pytest

from app.core.exceptions import AppError
from app.core.security import decode_token, hash_password, verify_password
from app.repositories import user_repository
from app.schemas.auth import IdentityGateRequest, RegisterRequest
from app.schemas.user import UserRead
from app.services import auth_service


def test_register_request_rejects_privileged_role():
    with pytest.raises(ValueError):
        RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="platform_admin")
    with pytest.raises(ValueError):
        RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="guest_lead")
    ok = RegisterRequest(name="X", email="x@e.com", password="Passw0rd!", role="np_admin")
    assert ok.role == "np_admin"


def test_identity_gate_request_requires_email_or_phone():
    with pytest.raises(ValueError):
        IdentityGateRequest()
    assert IdentityGateRequest(phone="+15550001").phone == "+15550001"


def test_user_read_flattens_causes():
    class _Cause:
        def __init__(self, c):
            self.cause = c

    class _User:
        id = 1
        role = "se"
        email = "m@e.com"
        phone = None
        name = "Mike"
        initials = "MI"
        color = "#C62828"
        status = "active"
        bio = None
        city = None
        avatar_media_id = None
        causes = [_Cause("Environment"), _Cause("Education")]

    read = UserRead.model_validate(_User())
    assert read.causes == ["Environment", "Education"]


@pytest.mark.asyncio
async def test_register_then_login(db_session):
    user = await auth_service.register(
        db_session, name="Mike Rivera", email="mike@e.com", password="Passw0rd!", role="se"
    )
    assert user.role == "se"
    assert user.initials == "MR"
    tokens = await auth_service.login(db_session, "mike@e.com", "Passw0rd!")
    assert tokens["token_type"] == "bearer"
    assert decode_token(tokens["access_token"])["sub"] == str(user.id)


@pytest.mark.asyncio
async def test_register_duplicate_email_conflict(db_session):
    await auth_service.register(db_session, name="A", email="dup@e.com", password="Passw0rd!", role="se")
    with pytest.raises(AppError) as exc:
        await auth_service.register(db_session, name="B", email="dup@e.com", password="Passw0rd!", role="se")
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_login_bad_credentials(db_session):
    await auth_service.register(db_session, name="A", email="a@e.com", password="Passw0rd!", role="se")
    with pytest.raises(AppError) as exc:
        await auth_service.login(db_session, "a@e.com", "wrong")
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_refresh_issues_new_access(db_session):
    user = await auth_service.register(db_session, name="A", email="r@e.com", password="Passw0rd!", role="se")
    tokens = await auth_service.login(db_session, "r@e.com", "Passw0rd!")
    refreshed = await auth_service.refresh(db_session, tokens["refresh_token"])
    assert decode_token(refreshed["access_token"])["type"] == "access"
    assert decode_token(refreshed["access_token"])["sub"] == str(user.id)


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(db_session):
    await auth_service.register(db_session, name="A", email="ra@e.com", password="Passw0rd!", role="se")
    tokens = await auth_service.login(db_session, "ra@e.com", "Passw0rd!")
    with pytest.raises(AppError) as exc:
        await auth_service.refresh(db_session, tokens["access_token"])
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_identity_gate_creates_then_reuses_guest_lead(db_session):
    user1, tokens1 = await auth_service.identity_gate(db_session, email=None, phone="+15550009", name=None)
    assert user1.role == "guest_lead"
    assert tokens1["access_token"]
    user2, _ = await auth_service.identity_gate(db_session, email=None, phone="+15550009", name=None)
    assert user2.id == user1.id


@pytest.mark.asyncio
async def test_google_mock_creates_se(db_session):
    user, tokens = await auth_service.google_mock(db_session, email="mike.rivera@demo.charityhub.com", name="Mike Rivera")
    assert user.role == "se"
    assert tokens["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_identity_gate_creates_then_reuses_guest_lead_by_email(db_session):
    user1, tokens1 = await auth_service.identity_gate(
        db_session, email="guest@e.com", phone=None, name=None
    )
    assert user1.role == "guest_lead"
    assert tokens1["access_token"]
    user2, _ = await auth_service.identity_gate(
        db_session, email="guest@e.com", phone=None, name=None
    )
    assert user2.id == user1.id


@pytest.mark.asyncio
async def test_identity_gate_rejects_credentialed_account_by_email(db_session):
    registered = await auth_service.register(
        db_session, name="Real User", email="realuser@e.com", password="Passw0rd!", role="se"
    )
    assert registered.password_hash is not None

    with pytest.raises(AppError) as exc:
        await auth_service.identity_gate(
            db_session, email="realuser@e.com", phone=None, name=None
        )
    assert exc.value.status_code == 409
    assert exc.value.code == "conflict"


@pytest.mark.asyncio
async def test_identity_gate_rejects_credentialed_account_by_phone(db_session):
    registered = await auth_service.register(
        db_session, name="Real Phone User", email="realphone@e.com", password="Passw0rd!", role="se"
    )
    await user_repository.update(db_session, registered, phone="+15559999")

    with pytest.raises(AppError) as exc:
        await auth_service.identity_gate(
            db_session, email=None, phone="+15559999", name=None
        )
    assert exc.value.status_code == 409
    assert exc.value.code == "conflict"


@pytest.mark.asyncio
async def test_google_mock_rejects_credentialed_account(db_session):
    await auth_service.register(
        db_session, name="Real Google User", email="realgoogle@e.com", password="Passw0rd!", role="se"
    )

    with pytest.raises(AppError) as exc:
        await auth_service.google_mock(db_session, email="realgoogle@e.com", name=None)
    assert exc.value.status_code == 409
    assert exc.value.code == "conflict"


@pytest.mark.asyncio
async def test_google_mock_creates_se_for_new_email(db_session):
    user, tokens = await auth_service.google_mock(
        db_session, email="brandnew@e.com", name="Brand New"
    )
    assert user.role == "se"
    assert user.password_hash is None
    assert tokens["access_token"]


def test_hash_and_verify_password_handles_long_password():
    long_password = "x" * 100
    password_hash = hash_password(long_password)
    assert verify_password(long_password, password_hash) is True
    assert verify_password("y" * 100, password_hash) is False
