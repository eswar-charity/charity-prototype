from fastapi import APIRouter

from app.core.config import get_settings
from app.core.exceptions import AppError

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health():
    return {"status": "ok"}


if not get_settings().is_production:

    @router.get("/boom", include_in_schema=False)
    async def boom():
        # Test-only route exercising the AppError envelope; never in production.
        raise AppError(code="teapot", message="I'm a teapot", status_code=418)
