import pytest
from sqlalchemy import select

from app.models.enums import UserRole, UserStatus
from app.models.user import User, UserCause
from app.utils.identity import derive_initials, pick_color


def test_user_role_enum_values():
    assert set(UserRole) == {
        UserRole.se,
        UserRole.np_admin,
        UserRole.platform_admin,
        UserRole.guest_lead,
    }
    assert UserRole.se == "se"
    assert UserStatus.active == "active"


def test_derive_initials():
    assert derive_initials("Mike Rivera") == "MR"
    assert derive_initials("Jane") == "JA"
    assert derive_initials("  ") == "?"


def test_pick_color_is_deterministic_hex():
    c = pick_color("Mike Rivera")
    assert c.startswith("#") and len(c) == 7
    assert pick_color("Mike Rivera") == c


@pytest.mark.asyncio
async def test_persist_user_with_causes(db_session):
    user = User(
        role="se",
        email="mike@example.com",
        phone=None,
        password_hash="x",
        name="Mike Rivera",
        initials="MR",
        color="#C62828",
        status="active",
    )
    user.causes.append(UserCause(cause="Environment"))
    user.causes.append(UserCause(cause="Education"))
    db_session.add(user)
    await db_session.commit()

    fetched = (
        await db_session.execute(select(User).where(User.email == "mike@example.com"))
    ).scalar_one()
    assert fetched.id is not None
    assert fetched.avatar_media_id is None
    assert {c.cause for c in fetched.causes} == {"Environment", "Education"}
