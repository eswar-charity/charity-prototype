from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_user_optional, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.event import (
    EventCreateRequest,
    EventListResponse,
    EventRead,
    EventUpdateRequest,
)
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def feed(
    cause: str | None = None,
    discovery: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await event_service.feed(db, cause, discovery, page, limit)


@router.post("", response_model=EventRead, status_code=201)
async def create_event(
    payload: EventCreateRequest,
    user: User = Depends(require_role("se", "np_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.create_draft(db, user, payload.model_dump())


@router.get("/mine", response_model=EventListResponse)
async def list_my_events(
    statuses: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parsed = None
    if statuses:
        parsed = [s.strip() for s in statuses.split(",") if s.strip()]
    return await event_service.list_mine(db, user, parsed)


@router.get("/{key}", response_model=EventRead)
async def event_detail(
    key: str,
    db: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    return await event_service.get_detail(db, key, viewer)


@router.get("/{key}/backers")
async def event_backers(key: str, db: AsyncSession = Depends(get_db)):
    return await event_service.backers(db, key)


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    payload: EventUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.update_draft(db, user, event_id, payload.model_dump())


@router.post("/{event_id}/save-draft", response_model=EventRead)
async def save_draft(
    event_id: int,
    payload: EventUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.update_draft(db, user, event_id, payload.model_dump())


@router.post("/{event_id}/submit", response_model=EventRead)
async def submit_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.submit(db, user, event_id)


@router.post("/{event_id}/go-live", response_model=EventRead)
async def go_live(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.go_live(db, user, event_id)


@router.post("/{event_id}/complete", response_model=EventRead)
async def complete_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.complete(db, user, event_id)


@router.post("/{event_id}/join")
async def join_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.join(db, user, event_id)


@router.post("/{event_id}/like")
async def like_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.like(db, user, event_id)


@router.post("/{event_id}/save")
async def save_event(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await event_service.save(db, user, event_id)
