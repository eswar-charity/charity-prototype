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
async def test_se_create_draft_then_submit(client, db_session):
    from app.repositories import nonprofit_repository as np_repo

    np = await np_repo.create(
        db_session, name="Beach NP", slug="beach-np", category="Environment",
        verified=True, status="Verified", settlement_status="Ready",
    )
    headers = await _login(client, "se1@e.com", "se")
    created = await client.post(
        "/api/v1/events",
        headers=headers,
        json={"story": "Clean the beach together", "category": "Environment",
              "tags": ["beach", "cleanup"], "nonprofit_id": np.id},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "Draft"
    assert body["kind"] == "SE-led"
    assert body["title"].startswith("#")
    assert set(body["tags"]) == {"beach", "cleanup"}

    eid = body["id"]
    # Without nonprofit approval, submit stays Submitted — never Live.
    submitted = await client.post(f"/api/v1/events/{eid}/submit", headers=headers)
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "Submitted"
    assert submitted.json()["is_live"] is False

    # SE cannot force go-live before NP approval.
    go = await client.post(f"/api/v1/events/{eid}/go-live", headers=headers)
    assert go.status_code == 409

    # Unapproved event must not appear in public feed.
    feed = (await client.get("/api/v1/events")).json()
    assert all(e["key"] != body["key"] for e in feed["items"])


@pytest.mark.asyncio
async def test_se_submit_requires_nonprofit(client):
    headers = await _login(client, "se-no-np@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events",
            headers=headers,
            json={"story": "Missing nonprofit", "category": "Community"},
        )
    ).json()
    resp = await client.post(f"/api/v1/events/{created['id']}/submit", headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_se_goes_live_only_after_np_approval(client, db_session):
    from app.repositories import nonprofit_repository as np_repo

    np = await np_repo.create(
        db_session, name="Gate NP", slug="gate-np", category="Community",
        verified=True, status="Verified", settlement_status="Ready",
    )
    np_headers = await _login(client, "np-gate@e.com", "np_admin")
    np_admin_id = (await client.get("/api/v1/auth/me", headers=np_headers)).json()["id"]
    await np_repo.link_admin(db_session, np_admin_id, np.id)

    se_headers = await _login(client, "se-gate@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events",
            headers=se_headers,
            json={"story": "Needs approval", "category": "Community", "nonprofit_id": np.id},
        )
    ).json()
    await client.post(f"/api/v1/events/{created['id']}/submit", headers=se_headers)

    # Public cannot view unapproved SE event.
    assert (await client.get(f"/api/v1/events/{created['key']}")).status_code == 404
    # Owner can still view.
    owner_view = await client.get(
        f"/api/v1/events/{created['key']}", headers=se_headers
    )
    assert owner_view.status_code == 200
    assert owner_view.json()["status"] == "Submitted"

    approved = await client.post(
        f"/api/v1/np/approvals/{created['id']}/approve", headers=np_headers
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Live"
    assert approved.json()["is_live"] is True

    # After NP approval, event is public.
    public = await client.get(f"/api/v1/events/{created['key']}")
    assert public.status_code == 200
    assert public.json()["status"] == "Live"


@pytest.mark.asyncio
async def test_np_led_submit_auto_publishes_and_appears_in_feed(client, db_session):
    from app.repositories import nonprofit_repository as np_repo

    np = await np_repo.create(
        db_session, name="Own NP", slug="own-np", category="Sports",
        verified=True, status="Verified", settlement_status="Ready",
    )
    headers = await _login(client, "np1@e.com", "np_admin")
    np_admin_id = (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]
    await np_repo.link_admin(db_session, np_admin_id, np.id)

    created = await client.post(
        "/api/v1/events",
        headers=headers,
        json={
            "title": "#GolfOuting",
            "story": "Charity golf",
            "category": "Sports",
            "nonprofit_id": np.id,
        },
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
async def test_np_partner_event_requires_beneficiary_approval(client, db_session):
    """NP admin creating for another nonprofit must not skip that org's approval."""
    from app.repositories import nonprofit_repository as np_repo

    own = await np_repo.create(
        db_session, name="Creator NP", slug="creator-np", category="Community",
        verified=True, status="Verified", settlement_status="Ready",
    )
    partner = await np_repo.create(
        db_session, name="Partner NP", slug="partner-np", category="Community",
        verified=True, status="Verified", settlement_status="Ready",
    )
    creator_headers = await _login(client, "np-creator@e.com", "np_admin")
    creator_id = (await client.get("/api/v1/auth/me", headers=creator_headers)).json()["id"]
    await np_repo.link_admin(db_session, creator_id, own.id)

    partner_headers = await _login(client, "np-partner@e.com", "np_admin")
    partner_id = (await client.get("/api/v1/auth/me", headers=partner_headers)).json()["id"]
    await np_repo.link_admin(db_session, partner_id, partner.id)

    created = (
        await client.post(
            "/api/v1/events",
            headers=creator_headers,
            json={
                "story": "For another nonprofit",
                "category": "Community",
                "nonprofit_id": partner.id,
            },
        )
    ).json()
    assert created["kind"] == "SE-led"

    submitted = await client.post(
        f"/api/v1/events/{created['id']}/submit", headers=creator_headers
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "Submitted"
    assert submitted.json()["is_live"] is False

    feed = (await client.get("/api/v1/events")).json()
    assert all(e["key"] != created["key"] for e in feed["items"])

    approved = await client.post(
        f"/api/v1/np/approvals/{created['id']}/approve", headers=partner_headers
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "Live"


@pytest.mark.asyncio
async def test_detail_and_404(client):
    headers = await _login(client, "se2@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events", headers=headers,
            json={"story": "A story here", "category": "Community"},
        )
    ).json()
    # Draft is not public.
    assert (await client.get(f"/api/v1/events/{created['key']}")).status_code == 404
    # Owner can open draft detail.
    resp = await client.get(f"/api/v1/events/{created['key']}", headers=headers)
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
async def test_join_like_save(client, db_session):
    from app.repositories import nonprofit_repository as np_repo

    np = await np_repo.create(
        db_session, name="Join NP", slug="join-np", category="Community",
        verified=True, status="Verified", settlement_status="Ready",
    )
    headers = await _login(client, "np2@e.com", "np_admin")
    np_admin_id = (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]
    await np_repo.link_admin(db_session, np_admin_id, np.id)
    created = (
        await client.post(
            "/api/v1/events", headers=headers,
            json={
                "title": "#JoinMe",
                "story": "come",
                "category": "Community",
                "nonprofit_id": np.id,
            },
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

    detail = await client.get(f"/api/v1/events/{created['key']}", headers=joiner)
    assert detail.status_code == 200
    body = detail.json()
    assert body["viewer_joined"] is True
    assert body["viewer_liked"] is False  # toggled off above
    assert body["viewer_saved"] is True

    anon = await client.get(f"/api/v1/events/{created['key']}")
    assert anon.status_code == 200
    assert anon.json()["viewer_joined"] is False


@pytest.mark.asyncio
async def test_backers_empty_for_now(client):
    headers = await _login(client, "se3@e.com", "se")
    created = (
        await client.post("/api/v1/events", headers=headers, json={"story": "backers"})
    ).json()
    resp = await client.get(f"/api/v1/events/{created['key']}/backers")
    assert resp.status_code == 200
    assert resp.json() == []
