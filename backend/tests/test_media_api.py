import pytest

from app.integrations import cloudinary as cl


async def _auth(client, email="mu@e.com"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Media User", "email": email, "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_sign_requires_auth(client):
    resp = await client.post("/api/v1/media/sign", json={"folder": "charity/avatars"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_sign_ok(client):
    headers = await _auth(client, "s1@e.com")
    resp = await client.post(
        "/api/v1/media/sign",
        headers=headers,
        json={"folder": "charity/avatars", "resource_type": "image"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["signature"]
    assert body["folder"] == "charity/avatars"


@pytest.mark.asyncio
async def test_create_media_201(client):
    headers = await _auth(client, "s2@e.com")
    resp = await client.post(
        "/api/v1/media",
        headers=headers,
        json={
            "public_id": "charity/a1",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/a1.jpg",
            "resource_type": "image",
            "format": "jpg",
            "bytes": 2048,
            "entity_type": "avatar",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"]
    assert body["owner_id"]


@pytest.mark.asyncio
async def test_create_media_too_large_400(client):
    headers = await _auth(client, "s3@e.com")
    resp = await client.post(
        "/api/v1/media",
        headers=headers,
        json={"public_id": "big", "secure_url": "u", "resource_type": "image",
              "format": "jpg", "bytes": 11 * 1024 * 1024},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "file_too_large"


@pytest.mark.asyncio
async def test_create_media_unsupported_format_400(client):
    headers = await _auth(client, "s4@e.com")
    resp = await client.post(
        "/api/v1/media",
        headers=headers,
        json={"public_id": "x", "secure_url": "u", "resource_type": "image",
              "format": "bmp", "bytes": 10},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "unsupported_format"


@pytest.mark.asyncio
async def test_get_media_and_404(client):
    headers = await _auth(client, "s5@e.com")
    created = (
        await client.post(
            "/api/v1/media",
            headers=headers,
            json={"public_id": "g1", "secure_url": "https://x/g1.png",
                  "resource_type": "image", "format": "png", "bytes": 100},
        )
    ).json()
    resp = await client.get(f"/api/v1/media/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["public_id"] == "g1"
    nf = await client.get("/api/v1/media/999999")
    assert nf.status_code == 404


@pytest.mark.asyncio
async def test_delete_media_owner(client, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    headers = await _auth(client, "s6@e.com")
    created = (
        await client.post(
            "/api/v1/media",
            headers=headers,
            json={"public_id": "d1", "secure_url": "u", "resource_type": "image",
                  "format": "jpg", "bytes": 100},
        )
    ).json()
    resp = await client.delete(f"/api/v1/media/{created['id']}", headers=headers)
    assert resp.status_code == 200
    assert (await client.get(f"/api/v1/media/{created['id']}")).status_code == 404


@pytest.mark.asyncio
async def test_delete_media_non_owner_403(client, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    h1 = await _auth(client, "o1@e.com")
    created = (
        await client.post(
            "/api/v1/media",
            headers=h1,
            json={"public_id": "d2", "secure_url": "u", "resource_type": "image",
                  "format": "jpg", "bytes": 100},
        )
    ).json()
    h2 = await _auth(client, "o2@e.com")
    resp = await client.delete(f"/api/v1/media/{created['id']}", headers=h2)
    assert resp.status_code == 403
