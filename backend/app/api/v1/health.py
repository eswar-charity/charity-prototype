from fastapi import APIRouter

from app.core.exceptions import AppError

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health():
    return {"status": "ok"}


@router.get("/boom")
async def boom():
    # Test-only route exercising the AppError envelope.
    raise AppError(code="teapot", message="I'm a teapot", status_code=418)
