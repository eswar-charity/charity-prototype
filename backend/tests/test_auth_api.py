import pytest


@pytest.mark.asyncio
async def test_register_login_me_flow(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "Mike Rivera", "email": "mike@e.com", "password": "Passw0rd!", "role": "se"},
    )
    assert reg.status_code == 201
    body = reg.json()
    assert body["role"] == "se"
    assert body["initials"] == "MR"
    assert body["causes"] == []

    login = await client.post(
        "/api/v1/auth/login", json={"email": "mike@e.com", "password": "Passw0rd!"}
    )
    assert login.status_code == 200
    tokens = login.json()
    assert tokens["token_type"] == "bearer"

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "mike@e.com"


@pytest.mark.asyncio
async def test_register_rejects_privileged_role_422(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"name": "X", "email": "x@e.com", "password": "Passw0rd!", "role": "platform_admin"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_register_duplicate_409(client):
    payload = {"name": "A", "email": "dup@e.com", "password": "Passw0rd!", "role": "se"}
    await client.post("/api/v1/auth/register", json=payload)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "conflict"


@pytest.mark.asyncio
async def test_login_bad_credentials_401(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "a@e.com", "password": "Passw0rd!", "role": "se"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "a@e.com", "password": "nope"}
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "unauthorized"


@pytest.mark.asyncio
async def test_me_requires_auth_401(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_returns_new_access(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "r@e.com", "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": "r@e.com", "password": "Passw0rd!"}
        )
    ).json()
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_identity_gate_phone_creates_guest(client):
    resp = await client.post("/api/v1/auth/identity-gate", json={"phone": "+15550009"})
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_identity_gate_requires_email_or_phone_422(client):
    resp = await client.post("/api/v1/auth/identity-gate", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_google_mock_returns_tokens(client):
    resp = await client.post(
        "/api/v1/auth/google", json={"email": "mike.rivera@demo.charityhub.com", "name": "Mike Rivera"}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_logout_ok(client):
    resp = await client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
