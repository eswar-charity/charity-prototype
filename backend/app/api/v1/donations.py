from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.donation import (
    DonationCreateRequest,
    DonationRead,
    QuoteRequest,
    ReceiptResponse,
)
from app.services import donation_service

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("/quote", response_model=ReceiptResponse)
async def quote(payload: QuoteRequest):
    return donation_service.quote(payload.amount)


@router.post("", response_model=DonationRead, status_code=201)
async def create_donation(
    payload: DonationCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await donation_service.create_donation(
        db, user, payload.event_id, payload.amount, payload.public_name,
        payload.card_number,
    )


@router.get("/{donation_id}", response_model=DonationRead)
async def get_donation(donation_id: int, db: AsyncSession = Depends(get_db)):
    return await donation_service.get_donation(db, donation_id)


@router.get("/{donation_id}/receipt", response_model=DonationRead)
async def get_receipt(donation_id: int, db: AsyncSession = Depends(get_db)):
    return await donation_service.get_donation(db, donation_id)
