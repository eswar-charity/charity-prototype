"""Demo Social Entrepreneur (SE) accounts for local testing."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.utils.identity import derive_initials, pick_color

SE_DEMO_PASSWORD = "Passw0rd!"

# Primary organizer for catalog events stays first (Mike Rivera).
SE_ACCOUNT_ALIASES: list[dict[str, str]] = [
    {
        "email": "mike.rivera@demo.charityhub.com",
        "display_name": "Mike Rivera",
    },
    {
        "email": "jordan.blake@demo.charityhub.com",
        "display_name": "Jordan Blake",
    },
    {
        "email": "sam.okonkwo@demo.charityhub.com",
        "display_name": "Sam Okonkwo",
    },
    {
        "email": "priya.desai@demo.charityhub.com",
        "display_name": "Priya Desai",
    },
]

PRIMARY_SE_EMAIL = SE_ACCOUNT_ALIASES[0]["email"]


def _make_user(email: str, display_name: str) -> User:
    return User(
        role="se",
        email=email,
        name=display_name,
        password_hash=hash_password(SE_DEMO_PASSWORD),
        initials=derive_initials(display_name),
        color=pick_color(display_name),
        status="active",
    )


async def ensure_se_accounts(session: AsyncSession) -> dict[str, User]:
    """Upsert all demo SE accounts. Returns users keyed by email."""
    by_email: dict[str, User] = {}
    for alias in SE_ACCOUNT_ALIASES:
        email = alias["email"]
        name = alias["display_name"]
        u = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if u is None:
            u = _make_user(email, name)
            session.add(u)
            await session.flush()
        else:
            u.role = "se"
            u.name = name
            if not u.password_hash:  # never reset a password someone has changed
                u.password_hash = hash_password(SE_DEMO_PASSWORD)
            u.initials = derive_initials(name)
            u.color = pick_color(name)
            u.status = "active"
        by_email[email] = u
    await session.flush()
    return by_email
