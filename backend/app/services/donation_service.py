import logging

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.integrations import mock_stripe, stripe_payments
from app.models.donation import Donation
from app.models.event import Event
from app.models.user import User
from app.repositories import (
    admin_repository,
    donation_repository,
    event_repository,
    nonprofit_repository,
    notification_repository,
)
from app.services import qr_service
from app.utils.receipt import compute_receipt_dollars, to_cents, to_dollars

logger = logging.getLogger("app.donations")

MIN_DONATION = 1.0
MAX_DONATION = 10_000.0
BLOCKED_SETTLEMENT = ("Frozen", "Payout hold")
BLOCKED_NONPROFIT_STATUS = ("Suspended", "Rejected")


def quote(amount: float) -> dict:
    return compute_receipt_dollars(amount)


def _to_read(donation: Donation, client_secret: str | None = None) -> dict:
    out = {
        "id": donation.id,
        "event_id": donation.event_id,
        "donor_id": donation.donor_id,
        "donation": to_dollars(donation.donation_cents),
        "tip": to_dollars(donation.tip_cents),
        "processing_fee": to_dollars(donation.processing_fee_cents),
        "total": to_dollars(donation.total_cents),
        "public_name": donation.public_name,
        "status": donation.status,
        "payment_ref": donation.payment_ref,
        "provider": "stripe" if donation.payment_intent_id else "mock",
    }
    if client_secret:
        out["client_secret"] = client_secret
    return out


async def _check_beneficiary(db: AsyncSession, event: Event):
    """Settlement readiness gate: only fund nonprofits that can receive money."""
    np = (
        await nonprofit_repository.get_by_id(db, event.nonprofit_id)
        if event.nonprofit_id
        else None
    )
    if np is None:
        return None
    if np.status in BLOCKED_NONPROFIT_STATUS or np.settlement_status in BLOCKED_SETTLEMENT:
        raise AppError(
            "settlement_unavailable",
            "This nonprofit can't accept donations right now",
            status_code=409,
        )
    return np


async def create_donation(
    db: AsyncSession,
    user: User,
    event_id: int,
    amount: float,
    public_name: str | None,
    card_number: str | None = None,
) -> dict:
    settings = get_settings()
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if event.status != "Live" or not event.is_live:
        raise AppError(
            "invalid_state",
            "Donations are only available for live events",
            status_code=409,
        )
    if amount is None or amount < MIN_DONATION or amount > MAX_DONATION:
        raise AppError(
            "invalid_request",
            f"Donation must be between ${MIN_DONATION:.0f} and ${MAX_DONATION:,.0f}",
            status_code=400,
        )
    if not settings.stripe_enabled and settings.is_production:
        raise AppError(
            "payments_unavailable", "Payments are not configured", status_code=503
        )

    np = await _check_beneficiary(db, event)
    destination = None
    if settings.stripe_enabled:
        if np is not None and np.stripe_account_id and np.stripe_charges_enabled:
            destination = np.stripe_account_id
        elif not settings.allow_unconnected_nonprofits:
            raise AppError(
                "settlement_unavailable",
                "This nonprofit hasn't finished payment setup yet",
                status_code=409,
            )

    receipt = compute_receipt_dollars(amount)
    donation = await donation_repository.create(
        db,
        event_id=event_id,
        donor_id=user.id,
        donation_cents=to_cents(receipt["donation"]),
        tip_cents=to_cents(receipt["tip"]),
        processing_fee_cents=to_cents(receipt["processing_fee"]),
        total_cents=to_cents(receipt["total"]),
        public_name=public_name or user.name,
        status="Initiated",
    )

    if settings.stripe_enabled:
        pi = await stripe_payments.create_payment_intent(
            amount_cents=donation.total_cents,
            donation_id=donation.id,
            event_id=event.id,
            destination_account=destination,
            application_fee_cents=donation.tip_cents + donation.processing_fee_cents,
            description=f"Donation to {event.title}",
        )
        donation = await donation_repository.update(
            db, donation, payment_intent_id=pi["id"], payment_ref=pi["id"]
        )
        return _to_read(donation, client_secret=pi["client_secret"])

    # Dev/test only: deterministic mock provider (never reachable in production).
    result = mock_stripe.charge(card_number, donation.total_cents)
    if result["status"] == "Successful":
        donation = await donation_repository.update(
            db, donation, payment_ref=result["reference"]
        )
        await _finalize_success(db, donation)
    else:
        donation = await donation_repository.update(db, donation, status="Failed")
    return _to_read(donation)


async def _finalize_success(db: AsyncSession, donation: Donation) -> bool:
    """Mark a donation successful exactly once and roll it into event totals."""
    if donation.status == "Successful":
        return False
    donation = await donation_repository.update(db, donation, status="Successful")
    dollars = int(round(donation.donation_cents / 100))
    await db.execute(
        update(Event)
        .where(Event.id == donation.event_id)
        .values(raised=Event.raised + dollars, backed=Event.backed + 1)
    )
    await db.commit()
    await _notify_success(db, donation)
    return True


async def _notify_success(db: AsyncSession, donation: Donation) -> None:
    try:
        event = await event_repository.get_by_id(db, donation.event_id)
        if not event:
            return
        text = f"{donation.public_name or 'Someone'} backed '{event.title}' with ${to_dollars(donation.donation_cents):,.2f}"
        recipients: set[int] = set()
        if event.organizer_id:
            recipients.add(event.organizer_id)
        if event.nonprofit_id:
            for admin_id in await nonprofit_repository.admin_user_ids(db, event.nonprofit_id):
                recipients.add(admin_id)
        for uid in recipients:
            await notification_repository.create(db, uid, "donation_received", text)
    except Exception:  # notifications must never break payment finalisation
        logger.exception("failed to send donation notifications")


async def _mark_failed(db: AsyncSession, donation: Donation) -> None:
    if donation.status == "Initiated":
        await donation_repository.update(db, donation, status="Failed")


async def _can_view(db: AsyncSession, user: User, donation: Donation) -> bool:
    if user.role == "platform_admin" or donation.donor_id == user.id:
        return True
    event = await event_repository.get_by_id(db, donation.event_id)
    return bool(event and await qr_service.can_staff_event(db, user, event))


async def get_donation(db: AsyncSession, user: User, donation_id: int) -> dict:
    donation = await donation_repository.get_by_id(db, donation_id)
    # Same response for "missing" and "not yours" so ids can't be enumerated.
    if not donation or not await _can_view(db, user, donation):
        raise AppError("not_found", "Donation not found", status_code=404)
    return _to_read(donation)


async def confirm_donation(db: AsyncSession, user: User, donation_id: int) -> dict:
    """Reconcile a donation with Stripe after the browser confirms payment.

    Webhooks remain the source of truth; this just closes the gap when the
    webhook is delayed so the donor sees the right result immediately.
    """
    donation = await donation_repository.get_by_id(db, donation_id)
    if not donation or donation.donor_id != user.id:
        raise AppError("not_found", "Donation not found", status_code=404)
    if donation.payment_intent_id and donation.status == "Initiated":
        pi = await stripe_payments.retrieve_payment_intent(donation.payment_intent_id)
        await _apply_payment_intent(db, donation, pi)
        donation = await donation_repository.get_by_id(db, donation_id)
    return _to_read(donation)


async def _apply_payment_intent(db: AsyncSession, donation: Donation, pi: dict) -> None:
    status = pi.get("status")
    if status == "succeeded":
        if pi.get("amount") != donation.total_cents or pi.get("currency") != "usd":
            logger.error("amount mismatch on donation %s", donation.id)
            raise AppError("amount_mismatch", "Payment amount mismatch", status_code=409)
        await _finalize_success(db, donation)
    elif status == "canceled":
        await _mark_failed(db, donation)
    # Other states (processing / requires_action / requires_payment_method)
    # are not final — the donor may still complete or retry payment.


# ---------------------------------------------------------------- webhooks

async def handle_stripe_event(db: AsyncSession, event: dict) -> None:
    """Idempotent dispatcher for verified Stripe webhook events."""
    etype = event.get("type", "")
    obj = (event.get("data") or {}).get("object") or {}

    if etype == "payment_intent.succeeded":
        donation = await donation_repository.get_by_payment_intent(db, obj.get("id", ""))
        if donation:
            try:
                await _apply_payment_intent(
                    db, donation,
                    {"status": "succeeded", "amount": obj.get("amount"),
                     "currency": obj.get("currency")},
                )
            except AppError as exc:
                if exc.code != "amount_mismatch":
                    raise
                # Don't make Stripe retry forever: park it for a human.
                await admin_repository.create_exception(
                    db, code=f"AMT-{donation.id}", type="Amount mismatch",
                    title=f"Paid amount differs from donation #{donation.id}",
                    entity_ref=f"donation:{donation.id}", severity="High", status="Open",
                    amount=int(round((obj.get("amount") or 0) / 100)),
                )
    elif etype in ("payment_intent.payment_failed", "payment_intent.canceled"):
        donation = await donation_repository.get_by_payment_intent(db, obj.get("id", ""))
        if donation:
            await _mark_failed(db, donation)
    elif etype == "charge.refunded":
        donation = await donation_repository.get_by_payment_intent(
            db, obj.get("payment_intent") or ""
        )
        if donation and obj.get("refunded"):
            await _apply_refund(db, donation)
    elif etype == "charge.dispute.created":
        donation = await donation_repository.get_by_payment_intent(
            db, obj.get("payment_intent") or ""
        )
        if donation:
            await _apply_dispute(db, donation, obj)
    elif etype == "account.updated":
        from app.services import stripe_connect_service

        await stripe_connect_service.apply_account_update(db, obj)


async def _apply_refund(db: AsyncSession, donation: Donation) -> None:
    if donation.status != "Successful":
        return
    await donation_repository.update(db, donation, status="Refunded")
    dollars = int(round(donation.donation_cents / 100))
    await db.execute(
        update(Event)
        .where(Event.id == donation.event_id)
        .values(raised=Event.raised - dollars, backed=Event.backed - 1)
    )
    await db.commit()


async def _apply_dispute(db: AsyncSession, donation: Donation, dispute: dict) -> None:
    if donation.status in ("Successful", "Refunded"):
        await donation_repository.update(db, donation, status="Disputed")
    await admin_repository.create_exception(
        db,
        code=f"DSP-{donation.id}",
        type="Dispute",
        title=f"Chargeback on donation #{donation.id}",
        entity_ref=f"donation:{donation.id}",
        severity="High",
        status="Open",
        amount=int(round((dispute.get("amount") or donation.total_cents) / 100)),
    )


async def refund_donation(db: AsyncSession, admin: User, donation_id: int) -> dict:
    donation = await donation_repository.get_by_id(db, donation_id)
    if not donation:
        raise AppError("not_found", "Donation not found", status_code=404)
    if donation.status != "Successful":
        raise AppError(
            "invalid_state", f"Cannot refund a '{donation.status}' donation", status_code=409
        )
    if donation.payment_intent_id:
        await stripe_payments.create_refund(donation.payment_intent_id, donation.id)
    await _apply_refund(db, donation)
    await admin_repository.add_audit(
        db, admin.name, admin.role, "Refunded donation", f"donation:{donation.id}", "Payments"
    )
    return _to_read(await donation_repository.get_by_id(db, donation_id))
