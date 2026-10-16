"""Thin async wrapper around the Stripe SDK.

Every network call runs in a worker thread (the SDK is synchronous) and is the
single seam tests monkeypatch, so no test ever reaches Stripe.
"""
import asyncio

import stripe

from app.core.config import get_settings
from app.core.exceptions import AppError

CURRENCY = "usd"


def _client() -> stripe.StripeClient:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise AppError(
            "payments_unavailable", "Payments are not configured", status_code=503
        )
    return stripe.StripeClient(settings.stripe_secret_key)


def _raise(exc: stripe.StripeError) -> AppError:
    if isinstance(exc, stripe.CardError):
        return AppError("card_declined", exc.user_message or "Card declined", status_code=402)
    return AppError(
        "payment_provider_error",
        "The payment provider could not complete the request",
        status_code=502,
    )


async def _run(fn, *args, **kwargs):
    try:
        return await asyncio.to_thread(fn, *args, **kwargs)
    except stripe.StripeError as exc:
        raise _raise(exc) from exc


async def create_connect_account(
    *, nonprofit_id: int, name: str, email: str | None
) -> str:
    client = _client()
    params: dict = {
        "type": "express",
        "country": "US",
        "business_type": "non_profit",
        "capabilities": {
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
        },
        "business_profile": {"name": name},
        "metadata": {"nonprofit_id": str(nonprofit_id)},
    }
    if email:
        params["email"] = email
    account = await _run(client.v1.accounts.create, params=params)
    return account.id


async def create_account_link(
    account_id: str, *, refresh_url: str, return_url: str
) -> str:
    client = _client()
    link = await _run(
        client.v1.account_links.create,
        params={
            "account": account_id,
            "refresh_url": refresh_url,
            "return_url": return_url,
            "type": "account_onboarding",
        },
    )
    return link.url


async def retrieve_account(account_id: str) -> dict:
    client = _client()
    account = await _run(client.v1.accounts.retrieve, account_id)
    return {
        "charges_enabled": bool(account.charges_enabled),
        "payouts_enabled": bool(account.payouts_enabled),
        "details_submitted": bool(account.details_submitted),
    }


async def retrieve_balance(account_id: str) -> dict:
    """Connected-account balance in dollars (available now / pending payout)."""
    client = _client()
    balance = await _run(
        client.v1.balance.retrieve, options={"stripe_account": account_id}
    )

    def total(rows) -> float:
        return round(sum(r.amount for r in rows if r.currency == CURRENCY) / 100, 2)

    return {"available": total(balance.available), "pending": total(balance.pending)}


async def create_payment_intent(
    *,
    amount_cents: int,
    donation_id: int,
    event_id: int,
    destination_account: str | None,
    application_fee_cents: int,
    description: str,
) -> dict:
    client = _client()
    params: dict = {
        "amount": amount_cents,
        "currency": CURRENCY,
        "automatic_payment_methods": {"enabled": True},
        "description": description,
        "metadata": {"donation_id": str(donation_id), "event_id": str(event_id)},
    }
    if destination_account:
        params["transfer_data"] = {"destination": destination_account}
        params["application_fee_amount"] = application_fee_cents
    pi = await _run(
        client.v1.payment_intents.create,
        params=params,
        options={"idempotency_key": f"donation-{donation_id}-create"},
    )
    return {"id": pi.id, "client_secret": pi.client_secret, "status": pi.status}


async def retrieve_payment_intent(payment_intent_id: str) -> dict:
    client = _client()
    pi = await _run(client.v1.payment_intents.retrieve, payment_intent_id)
    return {
        "id": pi.id,
        "status": pi.status,
        "amount": pi.amount,
        "currency": pi.currency,
        "latest_charge": pi.latest_charge,
    }


async def create_refund(payment_intent_id: str, donation_id: int) -> dict:
    client = _client()
    refund = await _run(
        client.v1.refunds.create,
        params={
            "payment_intent": payment_intent_id,
            "reverse_transfer": True,
            "refund_application_fee": True,
            "metadata": {"donation_id": str(donation_id)},
        },
        options={"idempotency_key": f"donation-{donation_id}-refund"},
    )
    return {"id": refund.id, "status": refund.status}


def construct_event(payload: bytes, signature: str | None) -> dict:
    """Verify the webhook signature and return the event as a plain dict."""
    settings = get_settings()
    secrets = [s for s in (settings.stripe_webhook_secret, settings.stripe_connect_webhook_secret) if s]
    if not secrets:
        raise AppError(
            "webhook_unconfigured", "Webhook secret is not configured", status_code=503
        )
    # Platform and Connect endpoints have different signing secrets; accept either.
    last_error: Exception | None = None
    for secret in secrets:
        try:
            event = stripe.Webhook.construct_event(payload, signature, secret)
            return event.to_dict() if hasattr(event, "to_dict") else dict(event)
        except (ValueError, stripe.SignatureVerificationError) as exc:
            last_error = exc
    raise AppError(
        "invalid_signature", "Invalid webhook signature", status_code=400
    ) from last_error
