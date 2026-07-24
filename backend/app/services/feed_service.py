from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.post import ChatMessage, Post, PostReply
from app.models.user import User
from app.repositories import (
    event_repository,
    feed_repository as frepo,
    user_repository,
)


async def _author_brief(db: AsyncSession, user_id: int | None) -> dict | None:
    if not user_id:
        return None
    u = await user_repository.get_by_id(db, user_id)
    if not u:
        return None
    return {"id": u.id, "name": u.name, "initials": u.initials, "color": u.color}


def _reply_read(reply: PostReply, author: dict | None) -> dict:
    return {
        "id": reply.id,
        "text": reply.text,
        "media_id": reply.media_id,
        "created_at": reply.created_at.isoformat(),
        "author": author,
    }


async def _post_read(db: AsyncSession, post: Post) -> dict:
    replies = []
    for r in post.replies:
        replies.append(_reply_read(r, await _author_brief(db, r.author_id)))
    return {
        "id": post.id,
        "phase": post.phase,
        "text": post.text,
        "highlight": post.highlight,
        "host": post.host,
        "verified": post.verified,
        "media_id": post.media_id,
        "media_alt": post.media_alt,
        "created_at": post.created_at.isoformat(),
        "author": await _author_brief(db, post.author_id),
        "replies": replies,
    }


def _message_read(msg: ChatMessage, author: dict | None) -> dict:
    return {
        "id": msg.id,
        "text": msg.text,
        "reaction": msg.reaction,
        "host": msg.host,
        "verified": msg.verified,
        "created_at": msg.created_at.isoformat(),
        "author": author,
    }


async def _event_or_404(db: AsyncSession, *, key: str | None = None, event_id: int | None = None):
    event = (
        await event_repository.get_by_key(db, key)
        if key is not None
        else await event_repository.get_by_id(db, event_id)
    )
    if not event:
        raise AppError("not_found", "Event not found", status_code=404)
    return event


async def list_thread(db: AsyncSession, key: str, page: int, limit: int) -> dict:
    event = await _event_or_404(db, key=key)
    posts, total, has_more = await frepo.list_posts(db, event.id, page, limit)
    return {
        "items": [await _post_read(db, p) for p in posts],
        "total": total,
        "has_more": has_more,
    }


async def create_post(
    db: AsyncSession, user: User, event_id: int, *, text: str | None, phase: str,
    media_id: int | None, media_alt: str | None, highlight: str | None, host: bool = False,
) -> dict:
    event = await _event_or_404(db, event_id=event_id)
    is_host = host or (event.organizer_id == user.id)
    post = await frepo.create_post(
        db, event_id=event_id, author_id=user.id, phase=phase or "during",
        text=text, highlight=highlight, host=is_host,
        verified=user.role in ("np_admin", "platform_admin"),
        media_id=media_id, media_alt=media_alt,
    )
    await event_repository.update(db, event, updates=event.updates + 1)
    return await _post_read(db, post)


async def add_reply(
    db: AsyncSession, user: User, post_id: int, text: str | None, media_id: int | None
) -> dict:
    post = await frepo.get_post(db, post_id)
    if not post:
        raise AppError("not_found", "Post not found", status_code=404)
    reply = await frepo.add_reply(
        db, post_id=post_id, author_id=user.id, text=text, media_id=media_id
    )
    return _reply_read(reply, await _author_brief(db, user.id))


async def post_update(
    db: AsyncSession, user: User, event_id: int, text: str | None, media_id: int | None
) -> dict:
    event = await _event_or_404(db, event_id=event_id)
    if event.organizer_id != user.id and user.role not in ("np_admin", "platform_admin"):
        raise AppError("forbidden", "Only the organizer can post updates", status_code=403)
    return await create_post(
        db, user, event_id, text=text, phase="during", media_id=media_id,
        media_alt=None, highlight=None, host=True,
    )


async def list_messages(db: AsyncSession, key: str, page: int, limit: int) -> dict:
    event = await _event_or_404(db, key=key)
    messages, total, has_more = await frepo.list_messages(db, event.id, page, limit)
    out = []
    for m in messages:
        out.append(_message_read(m, await _author_brief(db, m.user_id)))
    return {"items": out, "total": total, "has_more": has_more}


async def send_message(db: AsyncSession, user: User, event_id: int, text: str | None) -> dict:
    event = await _event_or_404(db, event_id=event_id)
    msg = await frepo.create_message(
        db, event_id=event_id, user_id=user.id, text=text,
        host=(event.organizer_id == user.id),
        verified=user.role in ("np_admin", "platform_admin"),
    )
    await event_repository.update(db, event, chat_count=event.chat_count + 1)
    return _message_read(msg, await _author_brief(db, user.id))
