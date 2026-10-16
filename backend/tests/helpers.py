"""Shared test helpers (imported explicitly; conftest.py holds the fixtures)."""
from app.db.session import get_db
from app.repositories import user_repository

CLOUD = "testcloud"


def cloud_url(public_id: str = "chat/sample", resource_type: str = "image", fmt: str = "jpg") -> str:
    return f"https://res.cloudinary.com/{CLOUD}/{resource_type}/upload/v1/{public_id}.{fmt}"


def media_payload(public_id: str = "chat/sample", **overrides) -> dict:
    payload = {
        "public_id": public_id,
        "secure_url": cloud_url(public_id),
        "resource_type": "image",
        "format": "jpg",
        "bytes": 2048,
    }
    payload.update(overrides)
    return payload


async def make_live_event(db_session, organizer_id=None, nonprofit_id=None, **kw):
    """Insert a Live event directly (approval flow is covered in test_approval_api)."""
    import uuid

    from app.repositories import event_repository

    kw.setdefault("key", f"live-{uuid.uuid4().hex[:8]}")
    kw.setdefault("title", "Live Event")
    kw.setdefault("category", "Community")
    return await event_repository.create(
        db_session, story="A live event", organizer_id=organizer_id,
        nonprofit_id=nonprofit_id, status="Live", is_live=True, kind="SE-led", **kw,
    )


async def me_id(client, headers) -> int:
    return (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]


async def promote(client, email: str, role: str) -> None:
    """Set a user's role directly in the test DB (np_admin / platform_admin are invite-only)."""
    app = client._transport.app
    override = app.dependency_overrides[get_db]
    async for session in override():
        user = await user_repository.get_by_email(session, email)
        await user_repository.update(session, user, role=role)


async def login_as(client, email: str, role: str = "se") -> dict:
    """Register as an SE, optionally promote, log in; return auth headers."""
    await client.post(
        "/api/v1/auth/register",
        json={"name": "U", "email": email, "password": "Passw0rd!", "role": "se"},
    )
    if role != "se":
        await promote(client, email, role)
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}
