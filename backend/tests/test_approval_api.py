import pytest

from tests.helpers import login_as

from app.repositories import nonprofit_repository as np_repo


async def _login(client, email, role="se"):
    return await login_as(client, email, role)


async def _me_id(client, headers):
    return (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]


async def _setup_np(client, db_session, email="npadm@e.com", slug="my-np"):
    """Create a nonprofit, an np_admin user, link them; return (headers, np, admin_id)."""
    np = await np_repo.create(
        db_session, name="My NP", slug=slug, category="Community", verified=True,
        status="Verified", settlement_status="Ready",
    )
    headers = await _login(client, email, "np_admin")
    admin_id = await _me_id(client, headers)
    await np_repo.link_admin(db_session, admin_id, np.id)
    return headers, np


async def _se_submits_event(client, se_headers, nonprofit_id):
    created = (
        await client.post(
            "/api/v1/events", headers=se_headers,
            json={"story": "Beach cleanup", "category": "Environment",
                  "nonprofit_id": nonprofit_id},
        )
    ).json()
    await client.post(f"/api/v1/events/{created['id']}/submit", headers=se_headers)
    return created["id"]


@pytest.mark.asyncio
async def test_queue_and_approve(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "npq@e.com", "np-queue")
    se_headers = await _login(client, "seq@e.com", "se")
    eid = await _se_submits_event(client, se_headers, np.id)

    queue = (await client.get("/api/v1/np/approvals", headers=np_headers)).json()
    assert any(item["id"] == eid for item in queue)

    approved = await client.post(
        f"/api/v1/np/approvals/{eid}/approve", headers=np_headers
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Live"
    assert approved.json()["is_live"] is True

    # Approved (Live) events remain visible on the Approvals page.
    queue_after = (await client.get("/api/v1/np/approvals", headers=np_headers)).json()
    approved_row = next(item for item in queue_after if item["id"] == eid)
    assert approved_row["status"] == "Live"


@pytest.mark.asyncio
async def test_request_changes_then_reject(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "npr@e.com", "np-reject")
    se_headers = await _login(client, "ser@e.com", "se")
    eid = await _se_submits_event(client, se_headers, np.id)

    rc = await client.post(
        f"/api/v1/np/approvals/{eid}/request-changes", headers=np_headers,
        json={
            "feedback": "Please add a clearer description",
            "areas": ["media_story"],
        },
    )
    assert rc.status_code == 200
    body = rc.json()
    assert body["status"] == "Changes Requested"
    assert body["change_request"]["feedback"] == "Please add a clearer description"
    assert body["change_request"]["areas"] == ["media_story"]

    rej = await client.post(
        f"/api/v1/np/approvals/{eid}/reject", headers=np_headers,
        json={"reason": "Not aligned with our cause"},
    )
    assert rej.status_code == 200
    assert rej.json()["status"] == "Rejected"


@pytest.mark.asyncio
async def test_approve_requires_np_admin(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "npx2@e.com", "np-x2")
    se_headers = await _login(client, "sex2@e.com", "se")
    eid = await _se_submits_event(client, se_headers, np.id)
    # SE cannot approve
    resp = await client.post(f"/api/v1/np/approvals/{eid}/approve", headers=se_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cannot_approve_other_nps_event(client, db_session):
    np1_headers, np1 = await _setup_np(client, db_session, "np1a@e.com", "np-1a")
    _np2_headers, np2 = await _setup_np(client, db_session, "np2a@e.com", "np-2a")
    se_headers = await _login(client, "sez@e.com", "se")
    eid = await _se_submits_event(client, se_headers, np2.id)
    # np1 admin tries to approve an event belonging to np2
    resp = await client.post(
        f"/api/v1/np/approvals/{eid}/approve", headers=np1_headers
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_autopilot_and_trusted_ses(client, db_session):
    np_headers, np = await _setup_np(client, db_session, "npap@e.com", "np-ap")
    # default
    ap = (await client.get("/api/v1/np/autopilot", headers=np_headers)).json()
    assert ap["enabled"] is False
    # enable + checks
    ap = (
        await client.patch(
            "/api/v1/np/autopilot", headers=np_headers,
            json={"enabled": True, "checks": ["Verified 501c3", "No flags"]},
        )
    ).json()
    assert ap["enabled"] is True
    assert "Verified 501c3" in ap["checks"]
    # add trusted SE
    se_headers = await _login(client, "trustse@e.com", "se")
    se_id = await _me_id(client, se_headers)
    ap = (
        await client.post(
            "/api/v1/np/autopilot/trusted-ses", headers=np_headers,
            json={"se_user_id": se_id},
        )
    ).json()
    assert any(t["se_user_id"] == se_id for t in ap["trusted_ses"])
    # remove
    ap = (
        await client.delete(
            f"/api/v1/np/autopilot/trusted-ses/{se_id}", headers=np_headers
        )
    ).json()
    assert all(t["se_user_id"] != se_id for t in ap["trusted_ses"])
