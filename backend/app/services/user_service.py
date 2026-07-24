from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import user_repository
from app.utils.identity import derive_initials


async def get_profile(db: AsyncSession, user: User) -> User:
    return user


async def update_profile(
    db: AsyncSession,
    user: User,
    name: str | None = None,
    bio: str | None = None,
    city: str | None = None,
    causes: list[str] | None = None,
    avatar_media_id: int | None = None,
) -> User:
    fields: dict = {}
    if name is not None:
        fields["name"] = name
        fields["initials"] = derive_initials(name)
    if bio is not None:
        fields["bio"] = bio
    if city is not None:
        fields["city"] = city
    if avatar_media_id is not None:
        fields["avatar_media_id"] = avatar_media_id
    if fields:
        user = await user_repository.update(db, user, **fields)
    if causes is not None:
        user = await user_repository.set_causes(db, user, causes)
    return user
