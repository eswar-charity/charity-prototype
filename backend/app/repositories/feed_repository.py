from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import ChatMessage, Post, PostReply
from app.utils.pagination import paginate


async def list_posts(db: AsyncSession, event_id: int, page: int = 1, limit: int = 20):
    stmt = (
        select(Post)
        .where(Post.event_id == event_id)
        .order_by(Post.created_at.asc(), Post.id.asc())
    )
    return await paginate(db, stmt, page, limit)


async def create_post(db: AsyncSession, **fields) -> Post:
    post = Post(**fields)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def get_post(db: AsyncSession, post_id: int) -> Post | None:
    return (
        await db.execute(select(Post).where(Post.id == post_id))
    ).scalar_one_or_none()


async def add_reply(db: AsyncSession, **fields) -> PostReply:
    reply = PostReply(**fields)
    db.add(reply)
    await db.commit()
    await db.refresh(reply)
    return reply


async def list_messages(db: AsyncSession, event_id: int, page: int = 1, limit: int = 50):
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.event_id == event_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    )
    return await paginate(db, stmt, page, limit)


async def create_message(db: AsyncSession, **fields) -> ChatMessage:
    message = ChatMessage(**fields)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
