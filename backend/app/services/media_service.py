import re
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.integrations import cloudinary as cloudinary_integration
from app.models.media import MediaAsset
from app.models.user import User
from app.repositories import event_repository, media_repository, nonprofit_repository
from app.services import qr_service

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
IMAGE_FORMATS = {"jpg", "jpeg", "png", "webp", "gif", "heic"}
VIDEO_FORMATS = {"mp4", "mov", "webm"}

# Cloudinary folders the app is allowed to upload into / register from.
ALLOWED_FOLDERS = ("chat", "events", "avatars", "nonprofits", "posts")
_PUBLIC_ID_RE = re.compile(r"^[A-Za-z0-9_\-./]+$")


def sign_upload(folder: str, resource_type: str = "image") -> dict:
    if resource_type not in ("image", "video"):
        raise AppError(
            "unsupported_resource_type",
            "resource_type must be 'image' or 'video'",
            status_code=400,
        )
    if folder not in ALLOWED_FOLDERS:
        raise AppError(
            "invalid_folder",
            f"folder must be one of: {', '.join(ALLOWED_FOLDERS)}",
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


def _validate_origin(public_id: str, secure_url: str, resource_type: str) -> None:
    """Only accept assets that live in *our* Cloudinary account and folders."""
    cloud = get_settings().cloudinary_cloud_name
    if not cloud:
        raise AppError(
            "misconfigured", "Media uploads are not configured", status_code=503
        )
    parsed = urlparse(secure_url)
    expected_prefix = f"/{cloud}/{resource_type}/upload/"
    if (
        parsed.scheme != "https"
        or parsed.netloc != "res.cloudinary.com"
        or not parsed.path.startswith(expected_prefix)
    ):
        raise AppError(
            "invalid_media_url",
            "Media must be hosted on this project's Cloudinary account",
            status_code=400,
        )
    if (
        not _PUBLIC_ID_RE.match(public_id)
        or ".." in public_id
        or public_id.split("/", 1)[0] not in ALLOWED_FOLDERS
    ):
        raise AppError(
            "invalid_public_id", "Unrecognised Cloudinary public_id", status_code=400
        )


async def _authorize_entity(
    db: AsyncSession, user: User, entity_type: str | None, entity_id: int | None
) -> None:
    """A user may only attach media to things they own or manage."""
    if entity_id is None or user.role == "platform_admin":
        return
    allowed = True
    if entity_type == "event_photo":
        event = await event_repository.get_by_id(db, entity_id)
        allowed = bool(event and await qr_service.can_staff_event(db, user, event))
    elif entity_type == "avatar":
        allowed = entity_id == user.id
    elif entity_type in ("np_logo", "np_cover"):
        np = await nonprofit_repository.get_for_admin(db, user.id)
        allowed = bool(np and np.id == entity_id)
    if not allowed:
        raise AppError(
            "forbidden", "You can't attach media to that item", status_code=403
        )


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
    _validate_origin(public_id, secure_url, resource_type)
    await _authorize_entity(db, owner, entity_type, entity_id)

    if await media_repository.get_by_public_id(db, public_id):
        raise AppError("conflict", "This media has already been registered", status_code=409)

    if cloudinary_integration.is_configured():
        # Don't trust client-reported metadata: confirm the asset exists and
        # take size/format from Cloudinary itself.
        remote = cloudinary_integration.fetch_resource(public_id, resource_type)
        if remote is None:
            raise AppError("media_not_found", "Upload not found on Cloudinary", status_code=400)
        resource_type = remote.get("resource_type", resource_type)
        format = remote.get("format", format)
        bytes = int(remote.get("bytes", bytes))
        secure_url = remote.get("secure_url", secure_url)
        width = remote.get("width", width)
        height = remote.get("height", height)
        _validate(resource_type, format, bytes)
        _validate_origin(public_id, secure_url, resource_type)

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
