import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings
from app.core.exceptions import AppError


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    bcrypt only considers the first 72 bytes of the input; the raw bcrypt
    library (unlike passlib) raises ValueError beyond that instead of
    silently truncating, so we truncate explicitly and identically in both
    hash_password and verify_password to keep register/login consistent.
    """
    pw = password.encode()[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt(rounds=get_settings().bcrypt_rounds)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode()[:72], password_hash.encode())


def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: dict | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, extra: dict | None = None) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
        extra,
    )


def create_refresh_token(subject: str, jti: str | None = None) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        "refresh",
        timedelta(minutes=settings.refresh_token_expire_minutes),
        {"jti": jti or uuid.uuid4().hex},
    )


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise AppError("unauthorized", "Token has expired", status_code=401) from exc
    except jwt.InvalidTokenError as exc:
        raise AppError("unauthorized", "Invalid token", status_code=401) from exc
