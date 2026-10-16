import time

import cloudinary
import cloudinary.api
import cloudinary.uploader
import cloudinary.utils

from app.core.config import get_settings

# Formats Cloudinary itself will accept for a signed upload (enforced server
# side by Cloudinary because ``allowed_formats`` is part of the signature).
ALLOWED_FORMATS = {
    "image": "jpg,jpeg,png,webp,gif,heic",
    "video": "mp4,mov,webm",
}


def configure() -> None:
    """Configure the cloudinary SDK from settings (idempotent)."""
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def is_configured() -> bool:
    settings = get_settings()
    return bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )


def generate_signed_upload_params(folder: str, resource_type: str = "image") -> dict:
    """Build signed params for a direct browser->Cloudinary upload.

    Offline crypto only (no network): the frontend POSTs the file straight to
    Cloudinary with these params; the backend later persists the returned
    metadata via the media endpoints.
    """
    settings = get_settings()
    timestamp = int(time.time())
    allowed_formats = ALLOWED_FORMATS[resource_type]
    params_to_sign = {
        "folder": folder,
        "timestamp": timestamp,
        "allowed_formats": allowed_formats,
    }
    signature = cloudinary.utils.api_sign_request(
        params_to_sign, settings.cloudinary_api_secret
    )
    return {
        "cloud_name": settings.cloudinary_cloud_name,
        "api_key": settings.cloudinary_api_key,
        "timestamp": timestamp,
        "folder": folder,
        "allowed_formats": allowed_formats,
        "signature": signature,
        "resource_type": resource_type,
    }


def fetch_resource(public_id: str, resource_type: str = "image") -> dict | None:
    """Look an asset up on Cloudinary (Admin API). None when it doesn't exist."""
    configure()
    try:
        return cloudinary.api.resource(public_id, resource_type=resource_type)
    except cloudinary.exceptions.NotFound:
        return None


def destroy(public_id: str, resource_type: str = "image") -> dict:
    """Delete an asset from Cloudinary. Network call; monkeypatched in tests."""
    configure()
    return cloudinary.uploader.destroy(
        public_id, resource_type=resource_type, invalidate=True
    )
