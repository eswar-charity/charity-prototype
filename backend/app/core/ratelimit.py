"""Small in-process sliding-window rate limiter for unauthenticated endpoints.

State lives on ``app.state`` (one limiter per app instance). On serverless
hosts each warm instance keeps its own window, so this is a best-effort brake
on brute force, not a global guarantee; per-account lockout (auth_service)
covers password guessing across instances.
"""
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.config import get_settings
from app.core.exceptions import AppError


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            return False
        hits.append(now)
        return True


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(name: str, limit: int, window_seconds: int = 60):
    """FastAPI dependency factory: ``Depends(rate_limit("login", 10))``."""

    async def _dependency(request: Request) -> None:
        if not get_settings().rate_limit_enabled:
            return
        limiter = getattr(request.app.state, "rate_limiter", None)
        if limiter is None:
            limiter = request.app.state.rate_limiter = RateLimiter()
        if not limiter.check(f"{name}:{client_ip(request)}", limit, window_seconds):
            raise AppError(
                "rate_limited",
                "Too many requests — please slow down and try again shortly",
                status_code=429,
            )

    return _dependency
