from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.feed import (
    MessageCreateRequest,
    PostCreateRequest,
    ReplyCreateRequest,
    UpdateCreateRequest,
)
from app.services import feed_service

router = APIRouter(tags=["feed"])


@router.get("/events/{key}/posts")
async def list_thread(key: str, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await feed_service.list_thread(db, key, page, limit)


@router.post("/events/{event_id}/posts", status_code=201)
async def create_post(
    event_id: int,
    payload: PostCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.create_post(
        db, user, event_id, text=payload.text, phase=payload.phase,
        media_id=payload.media_id, media_alt=payload.media_alt,
        highlight=payload.highlight,
    )


@router.post("/posts/{post_id}/replies", status_code=201)
async def add_reply(
    post_id: int,
    payload: ReplyCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.add_reply(db, user, post_id, payload.text, payload.media_id)


@router.post("/events/{event_id}/updates", status_code=201)
async def post_update(
    event_id: int,
    payload: UpdateCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.post_update(db, user, event_id, payload.text, payload.media_id)


@router.get("/events/{key}/messages")
async def list_messages(
    key: str,
    page: int = 1,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.list_messages(db, key, page, limit)


@router.post("/events/{event_id}/messages", status_code=201)
async def send_message(
    event_id: int,
    payload: MessageCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await feed_service.send_message(
        db, user, event_id, payload.text, payload.media_id
    )
