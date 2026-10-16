from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.user import User
from app.repositories import media_repository, user_repository
from app.utils.identity import derive_initials


async def get_public_organizer(db: AsyncSession, user_id: int) -> dict:
    user = await user_repository.get_by_id(db, user_id)
    if user is None or user.role not in ("se", "np_admin") or user.status != "active":
        raise AppError("not_found", "Organizer not found", status_code=404)
    avatar = (
        await media_repository.get_by_id(db, user.avatar_media_id)
        if user.avatar_media_id
        else None
    )
    return {
        "id": user.id,
        "name": user.name,
        "initials": user.initials,
        "color": user.color,
        "bio": user.bio,
        "city": user.city,
        "causes": [c.cause for c in user.causes],
        "avatar_url": avatar.secure_url if avatar else None,
    }


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
    if avatar_media_id is not None:
        asset = await media_repository.get_by_id(db, avatar_media_id)
        if asset is None or asset.resource_type != "image":
            raise AppError("invalid_media", "Choose an uploaded image", status_code=400)
        if asset.owner_id != user.id:
            raise AppError(
                "forbidden", "You can only use media you uploaded", status_code=403
            )
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
