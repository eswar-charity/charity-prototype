"""Static/mock payment provider — no real Stripe API calls.

Deterministic: a card whose digits end in the failing suffix is declined;
everything else succeeds. Used to simulate successful and failed transactions.
"""

FAILING_SUFFIX = "0002"


def charge(card_number: str | None, amount_cents: int) -> dict:
    digits = "".join(c for c in (card_number or "") if c.isdigit())
    if digits.endswith(FAILING_SUFFIX):
        return {"status": "Failed", "reference": None}
    last4 = digits[-4:] if len(digits) >= 4 else "0000"
    return {"status": "Successful", "reference": f"mock_{amount_cents}_{last4}"}
