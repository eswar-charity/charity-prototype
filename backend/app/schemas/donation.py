from pydantic import BaseModel


class QuoteRequest(BaseModel):
    amount: float


class ReceiptResponse(BaseModel):
    donation: float
    tip: float
    processing_fee: float
    total: float


class DonationCreateRequest(BaseModel):
    event_id: int
    amount: float
    public_name: str | None = None
    card_number: str | None = None


class DonationRead(BaseModel):
    id: int
    event_id: int
    donor_id: int | None = None
    donation: float
    tip: float
    processing_fee: float
    total: float
    public_name: str | None = None
    status: str
    payment_ref: str | None = None
    provider: str = "mock"
    # Present only on the create response for real (Stripe) payments.
    client_secret: str | None = None
