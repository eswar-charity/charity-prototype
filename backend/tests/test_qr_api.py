import pytest

from app.repositories import nonprofit_repository as np_repo


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
            json={"story": "QR event", "category": "Community"},
        )
    ).json()


@pytest.mark.asyncio
async def test_event_qr_link(client):
    headers = await _login(client, "q1@e.com", "se")
    ev = await _event(client, headers)
    resp = await client.get(f"/api/v1/events/{ev['id']}/qr")
    assert resp.status_code == 200
    assert ev["key"] in resp.json()["url"]


@pytest.mark.asyncio
async def test_nonprofit_qr_link(client, db_session):
    np = await np_repo.create(
        db_session, name="QR NP", slug="qr-np", category="Community", verified=True,
        status="Verified", settlement_status="Ready",
    )
    resp = await client.get(f"/api/v1/nonprofits/{np.id}/qr")
    assert resp.status_code == 200
    assert "qr-np" in resp.json()["url"]


@pytest.mark.asyncio
async def test_checkin_and_list(client):
    headers = await _login(client, "q2@e.com", "se")
    ev = await _event(client, headers)
    ci = await client.post(
        f"/api/v1/events/{ev['id']}/checkin", headers=headers,
        json={"name": "Jamie Backer", "ticket_type": "Backer · $50", "backed": True},
    )
    assert ci.status_code == 201
    body = ci.json()
    assert body["name"] == "Jamie Backer"
    assert body["initials"] == "JB"
    assert body["checked_in_at"] is not None

    lst = await client.get(f"/api/v1/events/{ev['id']}/attendees", headers=headers)
    assert lst.status_code == 200
    assert len(lst.json()) == 1


@pytest.mark.asyncio
async def test_checkin_requires_organizer(client):
    owner = await _login(client, "q3@e.com", "se")
    ev = await _event(client, owner)
    other = await _login(client, "q4@e.com", "se")
    resp = await client.post(
        f"/api/v1/events/{ev['id']}/checkin", headers=other, json={"name": "X"}
    )
    assert resp.status_code == 403
