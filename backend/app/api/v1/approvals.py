from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.approval import (
    AutopilotUpdate,
    FeedbackRequest,
    ReasonRequest,
    TrustedSERequest,
)
from app.schemas.event import EventRead
from app.services import approval_service

router = APIRouter(prefix="/np", tags=["approvals"])


@router.get("/approvals")
async def approvals_queue(
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.list_queue(db, user)


@router.get("/approvals/{event_id}", response_model=EventRead)
async def approval_detail(
    event_id: int,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.review_detail(db, user, event_id)


@router.post("/approvals/{event_id}/approve", response_model=EventRead)
async def approve(
    event_id: int,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.approve(db, user, event_id)


@router.post("/approvals/{event_id}/reject", response_model=EventRead)
async def reject(
    event_id: int,
    payload: ReasonRequest,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.reject(db, user, event_id, payload.reason)


@router.post("/approvals/{event_id}/request-changes", response_model=EventRead)
async def request_changes(
    event_id: int,
    payload: FeedbackRequest,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.request_changes(
        db, user, event_id, payload.feedback, payload.areas
    )


@router.get("/autopilot")
async def get_autopilot(
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.get_autopilot(db, user)


@router.patch("/autopilot")
async def update_autopilot(
    payload: AutopilotUpdate,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.update_autopilot(db, user, payload.enabled, payload.checks)


@router.post("/autopilot/trusted-ses")
async def add_trusted(
    payload: TrustedSERequest,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.add_trusted(db, user, payload.se_user_id)


@router.delete("/autopilot/trusted-ses/{se_user_id}")
async def remove_trusted(
    se_user_id: int,
    user: User = Depends(require_role("np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approval_service.remove_trusted(db, user, se_user_id)
