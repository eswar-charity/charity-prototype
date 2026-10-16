from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.middleware.request_context import RequestContextMiddleware


DESCRIPTION = """
Charity Hub backend — a social participation network for nonprofit storytelling,
creative event-led engagement, and voluntary giving.

Covers authentication & RBAC (SE / Non-Profit / Guest / Admin; nonprofit and
admin accounts are invite-only), nonprofits, events (create wizard +
lifecycle; nonprofit approval publishes in one step), NP approvals &
autopilot, donations (Stripe Connect destination charges, webhooks), the
community feed / posts / chat, Cloudinary media, QR tickets & check-in,
notifications, role dashboards, and the admin portal.

Nonprofit/EIN verification is a manual admin status check; Stripe falls back to
a deterministic mock only outside production when no Stripe key is set.
See /docs for the interactive API.
""".strip()

TAGS_METADATA = [
    {"name": "auth", "description": "Registration, login, JWT refresh, identity gate, Google GIS."},
    {"name": "users", "description": "Current-user profile (SE creator profile)."},
    {"name": "nonprofits", "description": "Public nonprofit directory and NP self-profile."},
    {"name": "events", "description": "Create wizard, lifecycle, feed, detail, join/like/save."},
    {"name": "approvals", "description": "NP approval queue, decisions, and autopilot."},
    {"name": "donations", "description": "Mock-Stripe donations, quotes, and receipts."},
    {"name": "feed", "description": "Community thread (posts/replies), chat, live updates."},
    {"name": "media", "description": "Cloudinary signed uploads and metadata."},
    {"name": "qr", "description": "Share links and attendee check-in."},
    {"name": "dashboards", "description": "Notifications and NP/SE dashboards."},
    {"name": "admin", "description": "Platform-admin portal: review, verification, exceptions, audit."},
    {"name": "payments", "description": "Stripe config, webhooks, nonprofit Connect onboarding."},
    {"name": "meta", "description": "Public reference data: categories and causes."},
    {"name": "health", "description": "Service health."},
]


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description=DESCRIPTION,
        openapi_tags=TAGS_METADATA,
    )

    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
