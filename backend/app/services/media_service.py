from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.integrations import cloudinary as cloudinary_integration
from app.models.media import MediaAsset
from app.models.user import User
from app.repositories import media_repository

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
IMAGE_FORMATS = {"jpg", "jpeg", "png", "webp", "gif", "heic"}
VIDEO_FORMATS = {"mp4", "mov", "webm"}


def sign_upload(folder: str, resource_type: str = "image") -> dict:
    if resource_type not in ("image", "video"):
        raise AppError(
            "unsupported_resource_type",
            "resource_type must be 'image' or 'video'",
            status_code=400,
        )
    return cloudinary_integration.generate_signed_upload_params(folder, resource_type)


def _validate(resource_type: str, fmt: str, size_bytes: int) -> None:
    if resource_type not in ("image", "video"):
        raise AppError(
            "unsupported_resource_type",
            "resource_type must be 'image' or 'video'",
            status_code=400,
        )
    fmt_l = (fmt or "").lower()
    if resource_type == "image":
        if fmt_l not in IMAGE_FORMATS:
            raise AppError(
                "unsupported_format", f"Unsupported image format: {fmt}", status_code=400
            )
        if size_bytes > MAX_IMAGE_BYTES:
            raise AppError("file_too_large", "Image exceeds 10MB limit", status_code=400)
    else:
        if fmt_l not in VIDEO_FORMATS:
            raise AppError(
                "unsupported_format", f"Unsupported video format: {fmt}", status_code=400
            )
        if size_bytes > MAX_VIDEO_BYTES:
            raise AppError("file_too_large", "Video exceeds 100MB limit", status_code=400)


async def create_asset(
    db: AsyncSession,
    owner: User,
    *,
    public_id: str,
    secure_url: str,
    resource_type: str,
    format: str,
    bytes: int,
    width: int | None = None,
    height: int | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
) -> MediaAsset:
    _validate(resource_type, format, bytes)
    return await media_repository.create(
        db,
        public_id=public_id,
        secure_url=secure_url,
        resource_type=resource_type,
        format=format,
        bytes=bytes,
        width=width,
        height=height,
        owner_id=owner.id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


async def get_asset(db: AsyncSession, media_id: int) -> MediaAsset:
    media = await media_repository.get_by_id(db, media_id)
    if not media:
        raise AppError("not_found", "Media not found", status_code=404)
    return media


async def delete_asset(db: AsyncSession, user: User, media_id: int) -> None:
    media = await media_repository.get_by_id(db, media_id)
    if not media:
        raise AppError("not_found", "Media not found", status_code=404)
    if media.owner_id != user.id and user.role != "platform_admin":
        raise AppError(
            "forbidden", "Not allowed to delete this media", status_code=403
        )
    cloudinary_integration.destroy(media.public_id, media.resource_type)
    await media_repository.delete(db, media)
