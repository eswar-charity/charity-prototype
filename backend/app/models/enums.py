from enum import StrEnum


class UserRole(StrEnum):
    se = "se"
    np_admin = "np_admin"
    platform_admin = "platform_admin"
    guest_lead = "guest_lead"


class UserStatus(StrEnum):
    active = "active"
    suspended = "suspended"
    pending = "pending"


class ResourceType(StrEnum):
    image = "image"
    video = "video"


class MediaEntityType(StrEnum):
    avatar = "avatar"
    event_photo = "event_photo"
    np_logo = "np_logo"
    np_cover = "np_cover"
    post = "post"
