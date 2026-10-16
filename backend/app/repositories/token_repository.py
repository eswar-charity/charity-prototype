from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security import AccountInvite, RefreshToken


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_refresh(
    db: AsyncSession, jti: str, user_id: int, expires_at: datetime
) -> RefreshToken:
    row = RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_refresh(db: AsyncSession, jti: str) -> RefreshToken | None:
    return (
        await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    ).scalar_one_or_none()


async def revoke_refresh(db: AsyncSession, row: RefreshToken) -> None:
    if row.revoked_at is None:
        row.revoked_at = _now()
        await db.commit()


async def revoke_all_refresh(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=_now())
    )
    await db.commit()


async def create_invite(db: AsyncSession, **fields) -> AccountInvite:
    invite = AccountInvite(**fields)
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def get_invite_by_hash(db: AsyncSession, token_hash: str) -> AccountInvite | None:
    return (
        await db.execute(
            select(AccountInvite).where(AccountInvite.token_hash == token_hash)
        )
    ).scalar_one_or_none()


async def expire_open_invites(db: AsyncSession, nonprofit_id: int) -> None:
    await db.execute(
        update(AccountInvite)
        .where(
            AccountInvite.nonprofit_id == nonprofit_id,
            AccountInvite.accepted_at.is_(None),
            AccountInvite.expires_at > _now(),
        )
        .values(expires_at=_now())
    )
    await db.commit()


async def mark_invite_accepted(db: AsyncSession, invite: AccountInvite) -> None:
    invite.accepted_at = _now()
    await db.commit()
