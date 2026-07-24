from fastapi import APIRouter

from app.api.v1.approvals import router as approvals_router
from app.api.v1.auth import router as auth_router
from app.api.v1.donations import router as donations_router
from app.api.v1.events import router as events_router
from app.api.v1.health import router as health_router
from app.api.v1.media import router as media_router
from app.api.v1.nonprofits import router as nonprofits_router
from app.api.v1.users import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(media_router)
api_router.include_router(nonprofits_router)
api_router.include_router(events_router)
api_router.include_router(approvals_router)
api_router.include_router(donations_router)
