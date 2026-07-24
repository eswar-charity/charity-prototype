import pytest


async def _register_and_login(client, email="p@e.com"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Profile User", "email": email, "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_get_profile(client):
    headers = await _register_and_login(client)
    resp = await client.get("/api/v1/me/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Profile User"


@pytest.mark.asyncio
async def test_get_profile_requires_auth_401(client):
    resp = await client.get("/api/v1/me/profile")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_patch_profile_updates_fields_and_causes(client):
    headers = await _register_and_login(client, email="p2@e.com")
    resp = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={
            "bio": "Building change",
            "city": "Austin",
            "causes": ["Environment", "Education"],
            "avatar_media_id": 5,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["bio"] == "Building change"
    assert body["city"] == "Austin"
    assert body["avatar_media_id"] == 5
    assert sorted(body["causes"]) == ["Education", "Environment"]


@pytest.mark.asyncio
async def test_patch_profile_updates_initials_when_name_changes(client):
    headers = await _register_and_login(client, email="p4@e.com")
    resp = await client.patch(
        "/api/v1/me/profile",
        headers=headers,
        json={"name": "Jane Doe"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Jane Doe"
    assert body["initials"] == "JD"


@pytest.mark.asyncio
async def test_patch_profile_replaces_causes(client):
    headers = await _register_and_login(client, email="p3@e.com")
    await client.patch(
        "/api/v1/me/profile", headers=headers, json={"causes": ["Environment"]}
    )
    resp = await client.patch(
        "/api/v1/me/profile", headers=headers, json={"causes": ["Health"]}
    )
    assert resp.json()["causes"] == ["Health"]
