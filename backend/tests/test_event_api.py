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


@pytest.mark.asyncio
async def test_create_requires_auth(client):
    resp = await client.post("/api/v1/events", json={"story": "x"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_guest_lead_cannot_create(client):
    tokens = (
        await client.post("/api/v1/auth/identity-gate", json={"phone": "+15550000"})
    ).json()
    resp = await client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={"story": "x"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_se_create_draft_then_submit(client):
    headers = await _login(client, "se1@e.com", "se")
    created = await client.post(
        "/api/v1/events",
        headers=headers,
        json={"story": "Clean the beach together", "category": "Environment",
              "tags": ["beach", "cleanup"]},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "Draft"
    assert body["kind"] == "SE-led"
    assert body["title"].startswith("#")
    assert set(body["tags"]) == {"beach", "cleanup"}

    eid = body["id"]
    submitted = await client.post(f"/api/v1/events/{eid}/submit", headers=headers)
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "Submitted"


@pytest.mark.asyncio
async def test_np_led_submit_auto_publishes_and_appears_in_feed(client):
    headers = await _login(client, "np1@e.com", "np_admin")
    created = await client.post(
        "/api/v1/events",
        headers=headers,
        json={"title": "#GolfOuting", "story": "Charity golf", "category": "Sports"},
    )
    body = created.json()
    assert body["kind"] == "NP-led"
    eid = body["id"]
    submitted = (await client.post(f"/api/v1/events/{eid}/submit", headers=headers)).json()
    assert submitted["status"] == "Live"
    assert submitted["is_live"] is True

    feed = (await client.get("/api/v1/events")).json()
    assert any(e["key"] == body["key"] for e in feed["items"])


@pytest.mark.asyncio
async def test_detail_and_404(client):
    headers = await _login(client, "se2@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events", headers=headers,
            json={"story": "A story here", "category": "Community"},
        )
    ).json()
    resp = await client.get(f"/api/v1/events/{created['key']}")
    assert resp.status_code == 200
    assert resp.json()["key"] == created["key"]
    assert (await client.get("/api/v1/events/does-not-exist")).status_code == 404


@pytest.mark.asyncio
async def test_update_draft_only_owner(client):
    h1 = await _login(client, "owner1@e.com", "se")
    created = (
        await client.post("/api/v1/events", headers=h1, json={"story": "Owned event"})
    ).json()
    h2 = await _login(client, "intruder@e.com", "se")
    resp = await client.patch(
        f"/api/v1/events/{created['id']}", headers=h2, json={"location": "hacked"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_join_like_save(client):
    headers = await _login(client, "np2@e.com", "np_admin")
    created = (
        await client.post(
            "/api/v1/events", headers=headers,
            json={"title": "#JoinMe", "story": "come", "category": "Community"},
        )
    ).json()
    eid = created["id"]
    await client.post(f"/api/v1/events/{eid}/submit", headers=headers)

    joiner = await _login(client, "joiner@e.com", "se")
    j = await client.post(f"/api/v1/events/{eid}/join", headers=joiner)
    assert j.status_code == 200
    assert j.json()["joined"] is True
    assert j.json()["count"] == 1

    like1 = await client.post(f"/api/v1/events/{eid}/like", headers=joiner)
    assert like1.json()["liked"] is True
    like2 = await client.post(f"/api/v1/events/{eid}/like", headers=joiner)
    assert like2.json()["liked"] is False

    save1 = await client.post(f"/api/v1/events/{eid}/save", headers=joiner)
    assert save1.json()["saved"] is True


@pytest.mark.asyncio
async def test_backers_empty_for_now(client):
    headers = await _login(client, "se3@e.com", "se")
    created = (
        await client.post("/api/v1/events", headers=headers, json={"story": "backers"})
    ).json()
    resp = await client.get(f"/api/v1/events/{created['key']}/backers")
    assert resp.status_code == 200
    assert resp.json() == []
