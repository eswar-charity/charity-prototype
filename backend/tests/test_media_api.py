import pytest

from app.integrations import cloudinary as cl
from tests.helpers import cloud_url, login_as, media_payload


@pytest.mark.asyncio
async def test_sign_requires_auth(client):
    resp = await client.post("/api/v1/media/sign", json={"folder": "events"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_sign_ok_and_pins_allowed_formats(client):
    headers = await login_as(client, "s1@e.com")
    resp = await client.post(
        "/api/v1/media/sign",
        headers=headers,
        json={"folder": "avatars", "resource_type": "image"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["signature"]
    assert body["folder"] == "avatars"
    assert "png" in body["allowed_formats"]
    assert "mp4" not in body["allowed_formats"]


@pytest.mark.asyncio
async def test_sign_rejects_unknown_folder(client):
    headers = await login_as(client, "s1b@e.com")
    resp = await client.post(
        "/api/v1/media/sign",
        headers=headers,
        json={"folder": "somewhere/else", "resource_type": "image"},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "invalid_folder"


@pytest.mark.asyncio
async def test_create_media_201(client):
    headers = await login_as(client, "s2@e.com")
    resp = await client.post(
        "/api/v1/media", headers=headers,
        json=media_payload("avatars/a1", entity_type="avatar"),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"]
    assert body["owner_id"]


@pytest.mark.asyncio
async def test_create_media_too_large_400(client):
    headers = await login_as(client, "s3@e.com")
    resp = await client.post(
        "/api/v1/media", headers=headers,
        json=media_payload("chat/big", bytes=11 * 1024 * 1024),
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "file_too_large"


@pytest.mark.asyncio
async def test_create_media_unsupported_format_400(client):
    headers = await login_as(client, "s4@e.com")
    resp = await client.post(
        "/api/v1/media", headers=headers, json=media_payload("chat/x", format="bmp"),
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "unsupported_format"


@pytest.mark.asyncio
async def test_create_media_rejects_foreign_url(client):
    headers = await login_as(client, "s4b@e.com")
    for bad in (
        "https://evil.example.com/chat/x.jpg",
        "https://res.cloudinary.com/someone-else/image/upload/v1/chat/x.jpg",
        "http://res.cloudinary.com/testcloud/image/upload/v1/chat/x.jpg",
        "data:image/png;base64,AAAA",
    ):
        resp = await client.post(
            "/api/v1/media", headers=headers,
            json=media_payload("chat/x", secure_url=bad),
        )
        assert resp.status_code == 400, bad
        assert resp.json()["error"]["code"] == "invalid_media_url"


@pytest.mark.asyncio
async def test_create_media_rejects_bad_public_id(client):
    headers = await login_as(client, "s4c@e.com")
    for bad in ("secrets/x", "../chat/x", "chat/../../x"):
        resp = await client.post(
            "/api/v1/media", headers=headers,
            json=media_payload(bad, secure_url=cloud_url("chat/x")),
        )
        assert resp.status_code == 400, bad
        assert resp.json()["error"]["code"] == "invalid_public_id"


@pytest.mark.asyncio
async def test_create_media_duplicate_public_id_409(client):
    headers = await login_as(client, "s4d@e.com")
    assert (
        await client.post("/api/v1/media", headers=headers, json=media_payload("chat/dup"))
    ).status_code == 201
    again = await client.post("/api/v1/media", headers=headers, json=media_payload("chat/dup"))
    assert again.status_code == 409


@pytest.mark.asyncio
async def test_cannot_attach_media_to_someone_elses_event(client):
    owner = await login_as(client, "own-ev@e.com")
    other = await login_as(client, "other-ev@e.com")
    event = (
        await client.post("/api/v1/events", headers=owner, json={"story": "mine"})
    ).json()
    resp = await client.post(
        "/api/v1/media", headers=other,
        json=media_payload("events/steal", entity_type="event_photo", entity_id=event["id"]),
    )
    assert resp.status_code == 403
    ok = await client.post(
        "/api/v1/media", headers=owner,
        json=media_payload("events/mine", entity_type="event_photo", entity_id=event["id"]),
    )
    assert ok.status_code == 201


@pytest.mark.asyncio
async def test_get_media_and_404(client):
    headers = await login_as(client, "s5@e.com")
    created = (
        await client.post("/api/v1/media", headers=headers, json=media_payload("chat/g1", format="png",
                          secure_url=cloud_url("chat/g1", fmt="png")))
    ).json()
    resp = await client.get(f"/api/v1/media/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["public_id"] == "chat/g1"
    nf = await client.get("/api/v1/media/999999")
    assert nf.status_code == 404


@pytest.mark.asyncio
async def test_delete_media_owner(client, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    headers = await login_as(client, "s6@e.com")
    created = (
        await client.post("/api/v1/media", headers=headers, json=media_payload("chat/d1"))
    ).json()
    resp = await client.delete(f"/api/v1/media/{created['id']}", headers=headers)
    assert resp.status_code == 200
    assert (await client.get(f"/api/v1/media/{created['id']}")).status_code == 404


@pytest.mark.asyncio
async def test_delete_media_non_owner_403(client, monkeypatch):
    monkeypatch.setattr(cl, "destroy", lambda public_id, resource_type="image": {"result": "ok"})
    h1 = await login_as(client, "o1@e.com")
    created = (
        await client.post("/api/v1/media", headers=h1, json=media_payload("chat/d2"))
    ).json()
    h2 = await login_as(client, "o2@e.com")
    resp = await client.delete(f"/api/v1/media/{created['id']}", headers=h2)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_media_verifies_against_cloudinary_when_configured(client, monkeypatch):
    monkeypatch.setattr(cl, "is_configured", lambda: True)
    headers = await login_as(client, "s7@e.com")

    monkeypatch.setattr(cl, "fetch_resource", lambda pid, rt="image": None)
    missing = await client.post("/api/v1/media", headers=headers, json=media_payload("chat/ghost"))
    assert missing.status_code == 400
    assert missing.json()["error"]["code"] == "media_not_found"

    # Client lies about size; Cloudinary's own numbers win and are re-validated.
    monkeypatch.setattr(
        cl, "fetch_resource",
        lambda pid, rt="image": {
            "resource_type": "image", "format": "jpg", "bytes": 50 * 1024 * 1024,
            "secure_url": cloud_url(pid),
        },
    )
    big = await client.post("/api/v1/media", headers=headers, json=media_payload("chat/liar", bytes=10))
    assert big.status_code == 400
    assert big.json()["error"]["code"] == "file_too_large"
