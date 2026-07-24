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


async def _me_id(client, headers):
    return (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]


async def _setup_np(client, db_session, email, slug):
    np = await np_repo.create(
        db_session, name="NP", slug=slug, category="Community", verified=True,
        status="Verified", settlement_status="Ready",
    )
    headers = await _login(client, email, "np_admin")
    await np_repo.link_admin(db_session, await _me_id(client, headers), np.id)
    return headers, np


@pytest.mark.asyncio
async def test_np_launchpad_and_financials(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "dl1@e.com", "dash-np")
    se = await _login(client, "dse1@e.com", "se")
    # SE creates + submits an event for this NP, NP approves -> Live
    ev = (
        await client.post(
            "/api/v1/events", headers=se,
            json={"story": "Dash event", "category": "Community", "nonprofit_id": np.id},
        )
    ).json()
    await client.post(f"/api/v1/events/{ev['id']}/submit", headers=se)
    await client.post(f"/api/v1/np/approvals/{ev['id']}/approve", headers=np_headers)
    # a successful donation
    await client.post(
        "/api/v1/donations", headers=se,
        json={"event_id": ev["id"], "amount": 50, "card_number": "4242424242424242"},
    )

    lp = (await client.get("/api/v1/np/launchpad", headers=np_headers)).json()
    assert lp["stats"]["live_events"] == 1
    assert lp["stats"]["backers"] == 1

    fin = (await client.get("/api/v1/np/financials", headers=np_headers)).json()
    assert fin["total_raised"] == 50
    assert fin["supporters"] == 1

    act = (await client.get("/api/v1/np/activity", headers=np_headers)).json()
    assert act["total_raised"] == 50


@pytest.mark.asyncio
async def test_se_live_and_post_event(client):
    se = await _login(client, "dse2@e.com", "se")
    ev = (
        await client.post(
            "/api/v1/events", headers=se, json={"story": "Live dash"}
        )
    ).json()
    live = await client.get(f"/api/v1/se/live-dashboard/{ev['key']}", headers=se)
    assert live.status_code == 200
    assert "stats" in live.json()
    post = await client.get(f"/api/v1/se/post-event/{ev['key']}", headers=se)
    assert post.status_code == 200
    assert "impact" in post.json()


@pytest.mark.asyncio
async def test_se_live_dashboard_forbidden_for_non_owner(client):
    owner = await _login(client, "dse3@e.com", "se")
    ev = (await client.post("/api/v1/events", headers=owner, json={"story": "x"})).json()
    other = await _login(client, "dse4@e.com", "se")
    resp = await client.get(f"/api/v1/se/live-dashboard/{ev['key']}", headers=other)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_notifications_flow(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "dn1@e.com", "notif-np")
    se = await _login(client, "dnse@e.com", "se")
    ev = (
        await client.post(
            "/api/v1/events", headers=se,
            json={"story": "Notify me", "nonprofit_id": np.id},
        )
    ).json()
    await client.post(f"/api/v1/events/{ev['id']}/submit", headers=se)
    await client.post(f"/api/v1/np/approvals/{ev['id']}/approve", headers=np_headers)

    notifs = (await client.get("/api/v1/me/notifications", headers=se)).json()
    assert len(notifs) >= 1
    assert notifs[0]["read"] is False
    nid = notifs[0]["id"]
    marked = await client.patch(f"/api/v1/notifications/{nid}/read", headers=se)
    assert marked.status_code == 200
    assert marked.json()["read"] is True


@pytest.mark.asyncio
async def test_cannot_read_others_notification(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "dn2@e.com", "notif-np2")
    se = await _login(client, "dnse2@e.com", "se")
    ev = (
        await client.post(
            "/api/v1/events", headers=se, json={"story": "x", "nonprofit_id": np.id}
        )
    ).json()
    await client.post(f"/api/v1/events/{ev['id']}/submit", headers=se)
    await client.post(f"/api/v1/np/approvals/{ev['id']}/approve", headers=np_headers)
    nid = (await client.get("/api/v1/me/notifications", headers=se)).json()[0]["id"]

    intruder = await _login(client, "intru@e.com", "se")
    resp = await client.patch(f"/api/v1/notifications/{nid}/read", headers=intruder)
    assert resp.status_code == 404
