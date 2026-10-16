from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import token_repository, user_repository
from app.utils.identity import derive_initials, pick_color

# Roles an anonymous caller may ever end up holding. Everything else
# (np_admin, platform_admin) is invite/seed only.
SELF_SERVE_ROLES = ("se",)

# Verified against when the email is unknown so response time doesn't reveal
# whether an account exists.
_DUMMY_HASH = hash_password("not-a-real-password")


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def issue_tokens(db: AsyncSession, user: User) -> dict:
    refresh_token = create_refresh_token(subject=str(user.id))
    claims = jwt.decode(refresh_token, options={"verify_signature": False})
    await token_repository.create_refresh(
        db,
        jti=claims["jti"],
        user_id=user.id,
        expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc),
    )
    return {
        "access_token": create_access_token(
            subject=str(user.id), extra={"role": user.role}
        ),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def register(
    db: AsyncSession, name: str, email: str, password: str, role: str = "se"
) -> User:
    if role not in SELF_SERVE_ROLES:
        raise AppError(
            "forbidden", "This account type is by invitation only", status_code=403
        )
    if await user_repository.get_by_email(db, email):
        raise AppError("conflict", "Email already registered", status_code=409)
    return await user_repository.create(
        db,
        role=role,
        email=email,
        phone=None,
        password_hash=hash_password(password),
        name=name,
        initials=derive_initials(name),
        color=pick_color(name),
        status="active",
    )


def _as_aware(value: datetime) -> datetime:
    # SQLite (tests) returns naive datetimes; Postgres returns aware ones.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    settings = get_settings()
    user = await user_repository.get_by_email(db, email)
    if user is None or not user.password_hash:
        verify_password(password, _DUMMY_HASH)
        raise AppError("unauthorized", "Invalid credentials", status_code=401)

    if user.locked_until and _as_aware(user.locked_until) > _now():
        raise AppError(
            "account_locked",
            "Too many failed sign-in attempts — try again in a few minutes",
            status_code=429,
        )

    if not verify_password(password, user.password_hash):
        failures = user.failed_logins + 1
        fields: dict = {"failed_logins": failures}
        if failures >= settings.login_max_failures:
            fields["failed_logins"] = 0
            fields["locked_until"] = _now() + timedelta(
                minutes=settings.login_lock_minutes
            )
        await user_repository.update(db, user, **fields)
        raise AppError("unauthorized", "Invalid credentials", status_code=401)

    if user.status != "active":
        raise AppError("forbidden", "This account is not active", status_code=403)

    if user.failed_logins or user.locked_until:
        await user_repository.update(db, user, failed_logins=0, locked_until=None)
    return user


async def login(db: AsyncSession, email: str, password: str) -> dict:
    user = await authenticate(db, email, password)
    return await issue_tokens(db, user)


async def refresh(db: AsyncSession, refresh_token: str) -> dict:
    claims = decode_token(refresh_token)
    if claims.get("type") != "refresh" or not claims.get("jti"):
        raise AppError("unauthorized", "Invalid refresh token", status_code=401)
    row = await token_repository.get_refresh(db, claims["jti"])
    if row is None:
        raise AppError("unauthorized", "Invalid refresh token", status_code=401)
    if row.revoked_at is not None:
        # A rotated/revoked token was replayed: assume theft, kill the family.
        await token_repository.revoke_all_refresh(db, row.user_id)
        raise AppError("unauthorized", "Refresh token has been revoked", status_code=401)
    user = await user_repository.get_by_id(db, int(claims["sub"]))
    if not user or user.status != "active":
        raise AppError("unauthorized", "User not found", status_code=401)
    await token_repository.revoke_refresh(db, row)
    return await issue_tokens(db, user)


async def logout(db: AsyncSession, refresh_token: str | None) -> None:
    if not refresh_token:
        return
    try:
        claims = decode_token(refresh_token)
    except AppError:
        return
    jti = claims.get("jti")
    if claims.get("type") == "refresh" and jti:
        row = await token_repository.get_refresh(db, jti)
        if row is not None:
            await token_repository.revoke_refresh(db, row)


def _account_exists_error() -> AppError:
    return AppError(
        "conflict",
        "An account with this email already exists — please log in",
        status_code=409,
    )


async def identity_gate(
    db: AsyncSession, email: str | None, phone: str | None, name: str | None
) -> tuple[User, dict]:
    """Lightweight guest capture so a visitor can join/donate.

    Only ever mints a session for a ``guest_lead``. Any other existing account
    (SE, nonprofit admin, platform admin — with or without a password) must
    sign in normally, otherwise knowing someone's email would be enough to
    take over their account.
    """
    user = None
    if email:
        existing = await user_repository.get_by_email(db, email)
        if existing is not None and existing.role != "guest_lead":
            raise _account_exists_error()
        user = existing
    if not user and phone:
        existing = await user_repository.get_by_phone(db, phone)
        if existing is not None and existing.role != "guest_lead":
            raise _account_exists_error()
        user = existing
    if not user:
        display = name or (email.split("@")[0] if email else "Guest")
        user = await user_repository.create(
            db,
            role="guest_lead",
            email=email,
            phone=phone,
            password_hash=None,
            name=display,
            initials=derive_initials(display),
            color=pick_color(display),
            status="active",
        )
    return user, await issue_tokens(db, user)


def verify_google_id_token(token: str) -> dict:
    """Verify a Google GIS ID token; returns claims. Separated for tests to mock."""
    settings = get_settings()
    if not settings.google_client_id:
        raise AppError(
            "misconfigured",
            "Google sign-in is not configured",
            status_code=503,
        )
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        return id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except AppError:
        raise
    except Exception as exc:
        raise AppError(
            "unauthorized",
            "Invalid Google sign-in token",
            status_code=401,
        ) from exc


async def google_login(db: AsyncSession, id_token_str: str) -> tuple[User, dict]:
    claims = verify_google_id_token(id_token_str)
    email = (claims.get("email") or "").strip().lower()
    if not email:
        raise AppError("unauthorized", "Google account has no email", status_code=401)
    if not claims.get("email_verified"):
        raise AppError(
            "unauthorized",
            "Google email is not verified",
            status_code=401,
        )

    user = await user_repository.get_by_email(db, email)
    if user is not None and user.password_hash is not None:
        raise _account_exists_error()
    if user is not None and user.role in ("np_admin", "platform_admin"):
        # Privileged accounts are never reachable through social sign-in.
        raise _account_exists_error()
    if not user:
        display = (claims.get("name") or "").strip() or email.split("@")[0]
        user = await user_repository.create(
            db,
            role="se",
            email=email,
            phone=None,
            password_hash=None,
            name=display,
            initials=derive_initials(display),
            color=pick_color(display),
            status="active",
        )
    return user, await issue_tokens(db, user)
