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


class NonprofitStatus(StrEnum):
    draft = "Draft"
    submitted = "Submitted"
    pending_verification = "Pending Verification"
    verified = "Verified"
    active = "Active"
    rejected = "Rejected"
    suspended = "Suspended"


class SettlementStatus(StrEnum):
    ready = "Ready"
    payout_hold = "Payout hold"
    not_ready = "Not ready"
    frozen = "Frozen"


class EventStatus(StrEnum):
    draft = "Draft"
    submitted = "Submitted"
    changes_requested = "Changes Requested"
    live = "Live"  # nonprofit approval publishes in a single step
    completed = "Completed"
    archived = "Archived"
    cancelled = "Cancelled"
    rejected = "Rejected"


class EventKind(StrEnum):
    se_led = "SE-led"
    np_led = "NP-led"


class Visibility(StrEnum):
    public = "public"
    private = "private"


class PostPhase(StrEnum):
    before = "before"
    during = "during"
    after = "after"


class DonationStatus(StrEnum):
    initiated = "Initiated"
    pending = "Pending"
    successful = "Successful"
    failed = "Failed"
    refunded = "Refunded"
    disputed = "Disputed"


class ReviewStatus(StrEnum):
    new = "New"
    in_review = "In Review"
    escalated = "Escalated"
    approved = "Approved"
    rejected = "Rejected"
    closed = "Closed"


class ExceptionStatus(StrEnum):
    open = "Open"
    in_review = "In Review"
    escalated = "Escalated"
    resolved = "Resolved"


class ResourceType(StrEnum):
    image = "image"
    video = "video"


class MediaEntityType(StrEnum):
    avatar = "avatar"
    event_photo = "event_photo"
    np_logo = "np_logo"
    np_cover = "np_cover"
    post = "post"
