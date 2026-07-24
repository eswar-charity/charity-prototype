from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.integrations import mock_stripe
from app.models.donation import Donation
from app.models.user import User
from app.repositories import (
    donation_repository,
    event_repository,
)
from app.utils.receipt import compute_receipt_dollars, to_cents, to_dollars


def quote(amount: float) -> dict:
    return compute_receipt_dollars(amount)


def _to_read(donation: Donation) -> dict:
    return {
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
    }


async def create_donation(
    db: AsyncSession,
    user: User,
    event_id: int,
    amount: float,
    public_name: str | None,
    card_number: str | None,
) -> dict:
    event = await event_repository.get_by_id(db, event_id)
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    if amount is None or amount <= 0:
        raise AppError("invalid_request", "Donation amount must be positive", status_code=400)

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

    result = mock_stripe.charge(card_number, donation.total_cents)
    if result["status"] == "Successful":
        await donation_repository.update(
            db, donation, status="Successful", payment_ref=result["reference"]
        )
        await event_repository.update(
            db,
            event,
            raised=event.raised + int(round(receipt["donation"])),
            backed=event.backed + 1,
        )
    else:
        await donation_repository.update(db, donation, status="Failed")

    return _to_read(donation)


async def get_donation(db: AsyncSession, donation_id: int) -> dict:
    donation = await donation_repository.get_by_id(db, donation_id)
    if not donation:
        raise AppError("not_found", "Donation not found", status_code=404)
    return _to_read(donation)
