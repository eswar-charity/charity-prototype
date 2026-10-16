from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.integrations import stripe_payments
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import nonprofit_repository

# Statuses an admin set deliberately; Stripe state never overrides them.
LOCKED_SETTLEMENT = ("Frozen", "Payout hold")


async def _my_nonprofit(db: AsyncSession, user: User) -> Nonprofit:
    np = await nonprofit_repository.get_for_admin(db, user.id)
    if not np:
        raise AppError("not_found", "No nonprofit is linked to this account", status_code=404)
    return np


def _status_read(np: Nonprofit) -> dict:
    return {
        "enabled": get_settings().stripe_enabled,
        "connected": bool(np.stripe_account_id),
        "charges_enabled": np.stripe_charges_enabled,
        "payouts_enabled": np.stripe_payouts_enabled,
        "settlement_status": np.settlement_status,
    }


async def _apply_flags(
    db: AsyncSession, np: Nonprofit, charges: bool, payouts: bool
) -> Nonprofit:
    fields: dict = {
        "stripe_charges_enabled": charges,
        "stripe_payouts_enabled": payouts,
    }
    if np.settlement_status not in LOCKED_SETTLEMENT:
        fields["settlement_status"] = "Ready" if charges and payouts else "Not ready"
    return await nonprofit_repository.update(db, np, **fields)


async def start_onboarding(db: AsyncSession, user: User) -> dict:
    """Create (once) the nonprofit's Stripe Express account and return a hosted link."""
    if not get_settings().stripe_enabled:
        raise AppError("payments_unavailable", "Payments are not configured", status_code=503)
    np = await _my_nonprofit(db, user)
    if not np.stripe_account_id:
        account_id = await stripe_payments.create_connect_account(
            nonprofit_id=np.id, name=np.name, email=user.email
        )
        np = await nonprofit_repository.update(db, np, stripe_account_id=account_id)
    base = get_settings().public_base_url.rstrip("/")
    url = await stripe_payments.create_account_link(
        np.stripe_account_id,
        refresh_url=f"{base}/np/financials?stripe=refresh",
        return_url=f"{base}/np/financials?stripe=return",
    )
    return {"url": url}


async def status(db: AsyncSession, user: User) -> dict:
    np = await _my_nonprofit(db, user)
    balance = None
    if get_settings().stripe_enabled and np.stripe_account_id:
        remote = await stripe_payments.retrieve_account(np.stripe_account_id)
        np = await _apply_flags(
            db, np, remote["charges_enabled"], remote["payouts_enabled"]
        )
        if np.stripe_charges_enabled:
            balance = await stripe_payments.retrieve_balance(np.stripe_account_id)
    out = _status_read(np)
    out["balance"] = balance
    return out


async def apply_account_update(db: AsyncSession, account: dict) -> None:
    """Webhook ``account.updated``: keep readiness flags in sync."""
    np = await nonprofit_repository.get_by_stripe_account(db, account.get("id", ""))
    if np is None:
        return
    await _apply_flags(
        db, np, bool(account.get("charges_enabled")), bool(account.get("payouts_enabled"))
    )
