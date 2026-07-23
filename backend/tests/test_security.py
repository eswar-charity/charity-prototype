import jwt
import pytest

from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("Passw0rd!")
    assert hashed != "Passw0rd!"
    assert verify_password("Passw0rd!", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_access_token_has_type_and_subject():
    token = create_access_token(subject="42", extra={"role": "se"})
    claims = decode_token(token)
    assert claims["sub"] == "42"
    assert claims["type"] == "access"
    assert claims["role"] == "se"


def test_refresh_token_has_refresh_type():
    claims = decode_token(create_refresh_token(subject="7"))
    assert claims["sub"] == "7"
    assert claims["type"] == "refresh"


def test_decode_invalid_token_raises_401():
    with pytest.raises(AppError) as exc:
        decode_token("not-a-real-token")
    assert exc.value.status_code == 401
    assert exc.value.code == "unauthorized"


def test_decode_expired_token_raises_401():
    from app.core.config import get_settings

    settings = get_settings()
    expired = jwt.encode(
        {"sub": "1", "type": "access", "exp": 1},  # 1970 -> already expired
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(AppError) as exc:
        decode_token(expired)
    assert exc.value.status_code == 401


def test_create_access_token_accepts_no_extra():
    claims = decode_token(create_access_token(subject="9"))
    assert claims["sub"] == "9"
    assert claims["type"] == "access"
