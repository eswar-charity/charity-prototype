from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.config import get_settings
from app.db.session import get_db
from app.integrations import stripe_payments
from app.models.user import User
from app.services import donation_service, stripe_connect_service

router = APIRouter(tags=["payments"])


@router.get("/payments/config")
async def payments_config():
    """Public: which provider is active and the publishable key for Stripe.js."""
    settings = get_settings()
    return {
        "provider": "stripe" if settings.stripe_enabled else "mock",
        "publishable_key": settings.stripe_publishable_key or None,
    }


@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    event = stripe_payments.construct_event(
        payload, request.headers.get("stripe-signature")
    )
    await donation_service.handle_stripe_event(db, event)
    return {"received": True}


@router.post("/np/stripe/onboarding")
async def np_stripe_onboarding(
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await stripe_connect_service.start_onboarding(db, user)


@router.get("/np/stripe/status")
async def np_stripe_status(
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await stripe_connect_service.status(db, user)
