from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repository


def _extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    return auth.split(" ", 1)[1].strip()


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    token = _extract_bearer(request)
    if not token:
        raise AppError("unauthorized", "Not authenticated", status_code=401)
    claims = decode_token(token)
    if claims.get("type") != "access":
        raise AppError("unauthorized", "Invalid access token", status_code=401)
    user = await user_repository.get_by_id(db, int(claims["sub"]))
    if not user:
        raise AppError("unauthorized", "User not found", status_code=401)
    return user


async def get_current_user_optional(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User | None:
    token = _extract_bearer(request)
    if not token:
        return None
    try:
        claims = decode_token(token)
    except AppError:
        return None
    if claims.get("type") != "access":
        return None
    return await user_repository.get_by_id(db, int(claims["sub"]))


def require_role(*roles: str):
    async def _dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise AppError(
                "forbidden", "Insufficient permissions", status_code=403
            )
        return user

    return _dependency
