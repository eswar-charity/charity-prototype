import pytest

from app.repositories import admin_repository, nonprofit_repository as np_repo


async def _se_headers(client, email="asev@e.com"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "S", "email": email, "password": "Passw0rd!", "role": "se"},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_admin_requires_platform_admin(client):
    headers = await _se_headers(client)
    resp = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_dashboard(client, db_session, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin1@e.com")
    headers = auth_header(admin)
    resp = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    for key in ("review_queue", "open_exceptions", "live_events", "gmv_week"):
        assert key in body


@pytest.mark.asyncio
async def test_review_queue_and_action(client, db_session, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin2@e.com")
    headers = auth_header(admin)
    item = await admin_repository.create_review(
        db_session, code="RV-1", type="Nonprofit Verification", title="Verify Org",
        entity_ref="Some Org", status="New", priority="High",
        checks=[{"label": "EIN", "ok": True}],
    )
    lst = (await client.get("/api/v1/admin/review", headers=headers)).json()
    assert any(r["id"] == item.id for r in lst)
    approved = await client.post(
        f"/api/v1/admin/review/{item.id}/approve", headers=headers
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Approved"


@pytest.mark.asyncio
async def test_nonprofit_lifecycle_and_audit(client, db_session, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin3@e.com")
    headers = auth_header(admin)
    np = await np_repo.create(
        db_session, name="Pending Org", slug="pending-org", category="Community",
        verified=False, status="Submitted", settlement_status="Not ready",
    )
    verified = await client.post(
        f"/api/v1/admin/nonprofits/{np.id}/verify", headers=headers
    )
    assert verified.status_code == 200
    assert verified.json()["status"] == "Active"
    assert verified.json()["verified"] is True

    suspended = await client.post(
        f"/api/v1/admin/nonprofits/{np.id}/suspend", headers=headers
    )
    assert suspended.json()["status"] == "Suspended"

    audit = (await client.get("/api/v1/admin/audit", headers=headers)).json()
    assert any("Nonprofit verify" in a["action"] for a in audit)


@pytest.mark.asyncio
async def test_invite_nonprofit(client, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin4@e.com")
    headers = auth_header(admin)
    resp = await client.post(
        "/api/v1/admin/nonprofits/invite", headers=headers,
        json={"name": "Fresh Cause", "category": "Environment"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Submitted"
    assert resp.json()["slug"] == "fresh-cause"


@pytest.mark.asyncio
async def test_exceptions_action(client, db_session, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin5@e.com")
    headers = auth_header(admin)
    exc = await admin_repository.create_exception(
        db_session, code="EX-1", type="Payout", title="Payout stuck",
        severity="High", status="Open", amount=1200,
    )
    lst = (await client.get("/api/v1/admin/exceptions", headers=headers)).json()
    assert any(e["id"] == exc.id for e in lst)
    resolved = await client.post(
        f"/api/v1/admin/exceptions/{exc.id}/resolve", headers=headers
    )
    assert resolved.json()["status"] == "Resolved"


@pytest.mark.asyncio
async def test_events_oversight(client, db_session, make_user, auth_header):
    admin = await make_user(role="platform_admin", email="admin6@e.com")
    headers = auth_header(admin)
    se = await _se_headers(client, "ase2@e.com")
    await client.post("/api/v1/events", headers=se, json={"story": "Admin sees this"})
    events = (await client.get("/api/v1/admin/events", headers=headers)).json()
    assert len(events) >= 1
