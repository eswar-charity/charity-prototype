import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import hash_password
from app.models.nonprofit import Nonprofit
from app.models.user import User
from app.repositories import (
    admin_repository,
    nonprofit_repository,
    token_repository,
    user_repository,
)
from app.services import auth_service
from app.utils.identity import derive_initials, pick_color


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def invite_url(token: str) -> str:
    base = get_settings().public_base_url.rstrip("/")
    return f"{base}/accept-invite?token={token}"


async def create_nonprofit_admin_invite(
    db: AsyncSession, admin: User, nonprofit: Nonprofit, email: str
) -> dict:
    """Issue a single-use invite for a nonprofit admin account.

    Returns the raw token/URL exactly once — only a hash is stored. Until an
    email provider is wired up, the platform admin shares the link manually.
    """
    email = email.strip().lower()
    if await user_repository.get_by_email(db, email):
        raise AppError(
            "conflict", "An account with this email already exists", status_code=409
        )
    await token_repository.expire_open_invites(db, nonprofit.id)
    token = secrets.token_urlsafe(32)
    expires_at = _now() + timedelta(hours=get_settings().invite_expire_hours)
    await token_repository.create_invite(
        db,
        email=email,
        role="np_admin",
        nonprofit_id=nonprofit.id,
        token_hash=_hash(token),
        expires_at=expires_at,
        invited_by_id=admin.id,
    )
    return {
        "email": email,
        "nonprofit_id": nonprofit.id,
        "invite_url": invite_url(token),
        "expires_at": expires_at.isoformat(),
    }


async def _load_valid(db: AsyncSession, token: str):
    invite = await token_repository.get_invite_by_hash(db, _hash(token))
    if invite is None:
        raise AppError("invalid_invite", "This invite link is not valid", status_code=404)
    if invite.accepted_at is not None:
        raise AppError(
            "invite_used", "This invite has already been used", status_code=410
        )
    if _aware(invite.expires_at) <= _now():
        raise AppError("invite_expired", "This invite has expired", status_code=410)
    return invite


async def preview(db: AsyncSession, token: str) -> dict:
    invite = await _load_valid(db, token)
    np = await nonprofit_repository.get_by_id(db, invite.nonprofit_id)
    return {
        "email": invite.email,
        "role": invite.role,
        "nonprofit": {"id": np.id, "name": np.name, "slug": np.slug} if np else None,
    }


async def accept(db: AsyncSession, token: str, name: str, password: str):
    invite = await _load_valid(db, token)
    if await user_repository.get_by_email(db, invite.email):
        raise AppError(
            "conflict", "An account with this email already exists", status_code=409
        )
    user = await user_repository.create(
        db,
        role=invite.role,
        email=invite.email,
        phone=None,
        password_hash=hash_password(password),
        name=name,
        initials=derive_initials(name),
        color=pick_color(name),
        status="active",
    )
    await nonprofit_repository.link_admin(db, user.id, invite.nonprofit_id)
    await token_repository.mark_invite_accepted(db, invite)
    # Give the platform admin something to act on: verify the new org.
    np = await nonprofit_repository.get_by_id(db, invite.nonprofit_id)
    if np is not None and not np.verified:
        await admin_repository.create_review(
            db, code=f"NV-{np.id}", type="Nonprofit Verification",
            title=f"Verify {np.name}", entity_ref=np.name, submitted_by=user.name,
            submitted_role="np_admin", status="New", priority="High",
            summary=f"{user.name} accepted their invite. EIN {np.ein or 'not provided'} "
                    "needs verification before the nonprofit can go live.",
            checks=[
                {"label": "EIN provided", "ok": bool(np.ein)},
                {"label": "Admin account activated", "ok": True},
                {"label": "Payout account connected", "ok": np.stripe_charges_enabled},
            ],
        )
    return user, await auth_service.issue_tokens(db, user)
