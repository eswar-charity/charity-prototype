TIP_FLAT = 3.0
TIP_MIN = 1.0
TIP_RATE = 0.12
PROCESSING_RATE = 0.03964


def compute_receipt_dollars(donation: float) -> dict:
    """Mirror the frontend calcDonationReceipt.

    tip = $3 when donation >= 25, else max($1, 12% of donation);
    processing fee = 3.964% of (donation + tip).
    """
    donation = round(max(0.0, float(donation)), 2)
    tip = TIP_FLAT if donation >= 25 else max(TIP_MIN, round(donation * TIP_RATE, 2))
    subtotal = round(donation + tip, 2)
    processing_fee = round(subtotal * PROCESSING_RATE, 2)
    total = round(donation + tip + processing_fee, 2)
    return {
        "donation": donation,
        "tip": tip,
        "processing_fee": processing_fee,
        "total": total,
    }


def to_cents(amount: float) -> int:
    return int(round(amount * 100))


def to_dollars(cents: int) -> float:
    return round(cents / 100, 2)
