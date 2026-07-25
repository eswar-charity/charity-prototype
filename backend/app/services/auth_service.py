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
from app.repositories import user_repository
from app.utils.identity import derive_initials, pick_color


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(
            subject=str(user.id), extra={"role": user.role}
        ),
        "refresh_token": create_refresh_token(subject=str(user.id)),
        "token_type": "bearer",
    }


async def register(
    db: AsyncSession, name: str, email: str, password: str, role: str
) -> User:
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


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await user_repository.get_by_email(db, email)
    if not user or not user.password_hash or not verify_password(
        password, user.password_hash
    ):
        raise AppError("unauthorized", "Invalid credentials", status_code=401)
    return user


async def login(db: AsyncSession, email: str, password: str) -> dict:
    user = await authenticate(db, email, password)
    return issue_tokens(user)


async def refresh(db: AsyncSession, refresh_token: str) -> dict:
    claims = decode_token(refresh_token)
    if claims.get("type") != "refresh":
        raise AppError("unauthorized", "Invalid refresh token", status_code=401)
    user = await user_repository.get_by_id(db, int(claims["sub"]))
    if not user:
        raise AppError("unauthorized", "User not found", status_code=401)
    return {
        "access_token": create_access_token(
            subject=str(user.id), extra={"role": user.role}
        ),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def identity_gate(
    db: AsyncSession, email: str | None, phone: str | None, name: str | None
) -> tuple[User, dict]:
    user = None
    if email:
        existing = await user_repository.get_by_email(db, email)
        if existing is not None and existing.password_hash is not None:
            raise AppError(
                "conflict",
                "An account with this email already exists — please log in",
                status_code=409,
            )
        user = existing
    if not user and phone:
        existing = await user_repository.get_by_phone(db, phone)
        if existing is not None and existing.password_hash is not None:
            raise AppError(
                "conflict",
                "An account with this email already exists — please log in",
                status_code=409,
            )
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
    return user, issue_tokens(user)


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
        raise AppError(
            "conflict",
            "An account with this email already exists — please log in",
            status_code=409,
        )
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
    return user, issue_tokens(user)
