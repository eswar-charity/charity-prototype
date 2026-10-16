"""Curated short-alias NP admin accounts for USA_20 nonprofits."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.nonprofit import Nonprofit, NonprofitAdmin
from app.models.user import User
from app.utils.identity import derive_initials, pick_color

LEGACY_NP_EMAIL = "np@charityhub.com"
NP_DEMO_PASSWORD = "Passw0rd!"

# email, nonprofit Common Name (must match import_nonprofits name), display_name
NP_ACCOUNT_ALIASES: list[dict[str, str]] = [
    {"email": "redcross@charityhub.com", "nonprofit_name": "American Red Cross", "display_name": "American Red Cross Admin"},
    {"email": "feedingamerica@charityhub.com", "nonprofit_name": "Feeding America", "display_name": "Feeding America Admin"},
    {"email": "stjude@charityhub.com", "nonprofit_name": "St. Jude Children's Research Hospital", "display_name": "St. Jude Children's Research Hospital Admin"},
    {"email": "habitat@charityhub.com", "nonprofit_name": "Habitat for Humanity", "display_name": "Habitat for Humanity Admin"},
    {"email": "unitedway@charityhub.com", "nonprofit_name": "United Way", "display_name": "United Way Admin"},
    {"email": "goodwill@charityhub.com", "nonprofit_name": "Goodwill", "display_name": "Goodwill Admin"},
    {"email": "bgca@charityhub.com", "nonprofit_name": "Boys & Girls Clubs of America", "display_name": "Boys & Girls Clubs of America Admin"},
    {"email": "ymca@charityhub.com", "nonprofit_name": "YMCA of the USA", "display_name": "YMCA of the USA Admin"},
    {"email": "bbbs@charityhub.com", "nonprofit_name": "Big Brothers Big Sisters", "display_name": "Big Brothers Big Sisters Admin"},
    {"email": "makeawish@charityhub.com", "nonprofit_name": "Make-A-Wish America", "display_name": "Make-A-Wish America Admin"},
    {"email": "rmhc@charityhub.com", "nonprofit_name": "Ronald McDonald House Charities", "display_name": "Ronald McDonald House Charities Admin"},
    {"email": "komen@charityhub.com", "nonprofit_name": "Susan G. Komen", "display_name": "Susan G. Komen Admin"},
    {"email": "acs@charityhub.com", "nonprofit_name": "American Cancer Society", "display_name": "American Cancer Society Admin"},
    {"email": "alz@charityhub.com", "nonprofit_name": "Alzheimer's Association", "display_name": "Alzheimer's Association Admin"},
    {"email": "nature@charityhub.com", "nonprofit_name": "The Nature Conservancy", "display_name": "The Nature Conservancy Admin"},
    {"email": "sierraclub@charityhub.com", "nonprofit_name": "Sierra Club Foundation", "display_name": "Sierra Club Foundation Admin"},
    {"email": "charitywater@charityhub.com", "nonprofit_name": "charity: water", "display_name": "charity: water Admin"},
    {"email": "wwf@charityhub.com", "nonprofit_name": "World Wildlife Fund (WWF-US)", "display_name": "World Wildlife Fund (WWF-US) Admin"},
    {"email": "aspca@charityhub.com", "nonprofit_name": "ASPCA", "display_name": "ASPCA Admin"},
    {"email": "msf@charityhub.com", "nonprofit_name": "Doctors Without Borders USA", "display_name": "Doctors Without Borders USA Admin"},
]


def _make_user(email: str, display_name: str) -> User:
    return User(
        role="np_admin",
        email=email,
        name=display_name,
        password_hash=hash_password(NP_DEMO_PASSWORD),
        initials=derive_initials(display_name),
        color=pick_color(display_name),
        status="active",
    )


async def ensure_np_accounts(
    session: AsyncSession, by_name: dict[str, Nonprofit]
) -> list[User]:
    users: list[User] = []
    for alias in NP_ACCOUNT_ALIASES:
        np = by_name[alias["nonprofit_name"]]  # KeyError if missing
        u = (
            await session.execute(select(User).where(User.email == alias["email"]))
        ).scalar_one_or_none()
        if u is None:
            u = _make_user(alias["email"], alias["display_name"])
            session.add(u)
            await session.flush()
        else:
            u.role = "np_admin"
            u.name = alias["display_name"]
            if not u.password_hash:  # never reset a password someone has changed
                u.password_hash = hash_password(NP_DEMO_PASSWORD)
            u.initials = derive_initials(alias["display_name"])
            u.color = pick_color(alias["display_name"])
            u.status = "active"

        link = (
            await session.execute(
                select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
            )
        ).scalar_one_or_none()
        if link is None:
            session.add(NonprofitAdmin(user_id=u.id, nonprofit_id=np.id))
        else:
            link.nonprofit_id = np.id
        users.append(u)
    await session.flush()
    return users


async def remove_legacy_np_user(session: AsyncSession) -> None:
    u = (
        await session.execute(select(User).where(User.email == LEGACY_NP_EMAIL))
    ).scalar_one_or_none()
    if u is None:
        return
    links = (
        await session.execute(
            select(NonprofitAdmin).where(NonprofitAdmin.user_id == u.id)
        )
    ).scalars().all()
    for link in links:
        await session.delete(link)
    await session.delete(u)
    await session.flush()
