import time

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.core.config import get_settings


def configure() -> None:
    """Configure the cloudinary SDK from settings (idempotent)."""
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def generate_signed_upload_params(folder: str, resource_type: str = "image") -> dict:
    """Build signed params for a direct browser->Cloudinary upload.

    Offline crypto only (no network): the frontend POSTs the file straight to
    Cloudinary with these params; the backend later persists the returned
    metadata via the media endpoints.
    """
    settings = get_settings()
    timestamp = int(time.time())
    params_to_sign = {"folder": folder, "timestamp": timestamp}
    signature = cloudinary.utils.api_sign_request(
        params_to_sign, settings.cloudinary_api_secret
    )
    return {
        "cloud_name": settings.cloudinary_cloud_name,
        "api_key": settings.cloudinary_api_key,
        "timestamp": timestamp,
        "folder": folder,
        "signature": signature,
        "resource_type": resource_type,
    }


def destroy(public_id: str, resource_type: str = "image") -> dict:
    """Delete an asset from Cloudinary. Network call; monkeypatched in tests."""
    configure()
    return cloudinary.uploader.destroy(
        public_id, resource_type=resource_type, invalidate=True
    )
