from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services import qr_service

router = APIRouter(tags=["qr"])


class CheckInRequest(BaseModel):
    # Either a scanned ticket code, or a name for a walk-in.
    code: str | None = None
    name: str | None = None
    ticket_type: str | None = None
    backed: bool = False


@router.get("/events/{event_id}/qr")
async def event_qr(event_id: int, db: AsyncSession = Depends(get_db)):
    return await qr_service.event_qr(db, event_id)


@router.get("/nonprofits/{nonprofit_id}/qr")
async def nonprofit_qr(nonprofit_id: int, db: AsyncSession = Depends(get_db)):
    return await qr_service.nonprofit_qr(db, nonprofit_id)


@router.get("/events/{event_id}/ticket")
async def my_ticket(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await qr_service.my_ticket(db, user, event_id)


@router.post("/events/{event_id}/checkin", status_code=201)
async def check_in(
    event_id: int,
    payload: CheckInRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await qr_service.check_in(
        db, user, event_id, name=payload.name, ticket_type=payload.ticket_type,
        backed=payload.backed, code=payload.code,
    )


@router.get("/events/{event_id}/attendees")
async def list_attendees(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await qr_service.list_attendees(db, user, event_id)
