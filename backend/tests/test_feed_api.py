import pytest


async def _login(client, email, role="se"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "U", "email": email, "password": "Passw0rd!", "role": role},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _event(client, headers):
    return (
        await client.post(
            "/api/v1/events", headers=headers,
            json={"story": "Thread event", "category": "Community"},
        )
    ).json()


@pytest.mark.asyncio
async def test_post_and_thread_and_reply(client):
    headers = await _login(client, "f1@e.com", "se")
    ev = await _event(client, headers)

    post = await client.post(
        f"/api/v1/events/{ev['id']}/posts", headers=headers,
        json={"text": "We kicked off!", "phase": "during", "highlight": "Kickoff"},
    )
    assert post.status_code == 201
    body = post.json()
    assert body["host"] is True  # organizer posting
    assert body["author"]["id"]

    reply = await client.post(
        f"/api/v1/posts/{body['id']}/replies", headers=headers,
        json={"text": "So excited"},
    )
    assert reply.status_code == 201

    thread = (await client.get(f"/api/v1/events/{ev['key']}/posts")).json()
    assert thread["total"] == 1
    assert thread["items"][0]["replies"][0]["text"] == "So excited"

    # posting increments the event's updates counter
    detail = (await client.get(f"/api/v1/events/{ev['key']}")).json()
    assert detail["updates"] == 1


@pytest.mark.asyncio
async def test_thread_is_public(client):
    headers = await _login(client, "f2@e.com", "se")
    ev = await _event(client, headers)
    resp = await client.get(f"/api/v1/events/{ev['key']}/posts")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


@pytest.mark.asyncio
async def test_post_update_requires_organizer(client):
    owner = await _login(client, "f3@e.com", "se")
    ev = await _event(client, owner)
    other = await _login(client, "f4@e.com", "se")
    resp = await client.post(
        f"/api/v1/events/{ev['id']}/updates", headers=other, json={"text": "hi"}
    )
    assert resp.status_code == 403
    ok = await client.post(
        f"/api/v1/events/{ev['id']}/updates", headers=owner, json={"text": "Live now!"}
    )
    assert ok.status_code == 201
    assert ok.json()["host"] is True


@pytest.mark.asyncio
async def test_chat_requires_auth_and_send(client):
    headers = await _login(client, "f5@e.com", "se")
    ev = await _event(client, headers)
    # reading messages requires auth (chat is for members)
    assert (await client.get(f"/api/v1/events/{ev['key']}/messages")).status_code == 401

    sent = await client.post(
        f"/api/v1/events/{ev['id']}/messages", headers=headers, json={"text": "hello"}
    )
    assert sent.status_code == 201

    msgs = await client.get(f"/api/v1/events/{ev['key']}/messages", headers=headers)
    assert msgs.status_code == 200
    assert msgs.json()["total"] == 1
    assert msgs.json()["items"][0]["text"] == "hello"

    detail = (await client.get(f"/api/v1/events/{ev['key']}")).json()
    assert detail["chat_count"] == 1
