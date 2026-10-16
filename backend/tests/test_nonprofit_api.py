import pytest

from tests.helpers import login_as, media_payload

from app.repositories import nonprofit_repository as repo


async def _seed(db, name="Ocean Conservancy", slug="ocean-conservancy",
                category="Environment", verified=True):
    return await repo.create(
        db, name=name, slug=slug, category=category, verified=verified,
        status="Verified", settlement_status="Ready", mission="Protect oceans",
        ein="12-3456789", source="IRS BMF", color="#2C4B6E", initials="OC",
    )


async def _login(client, email, role):
    return await login_as(client, email, role)


@pytest.mark.asyncio
async def test_list_nonprofits(client, db_session):
    await _seed(db_session)
    await _seed(db_session, "Hoboken Homeless Home", "hoboken", "Community")
    resp = await client.get("/api/v1/nonprofits")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert "items" in body and "has_more" in body


@pytest.mark.asyncio
async def test_list_search(client, db_session):
    await _seed(db_session)
    await _seed(db_session, "Hoboken Homeless Home", "hoboken", "Community")
    resp = await client.get("/api/v1/nonprofits", params={"search": "ocean"})
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_get_profile(client, db_session):
    np = await _seed(db_session)
    # Live event for this nonprofit should appear on the public profile.
    se = await _login(client, "se-np-prof@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events",
            headers=se,
            json={
                "story": "Coastal cleanup day",
                "category": "Environment",
                "nonprofit_id": np.id,
            },
        )
    ).json()
    await client.post(f"/api/v1/events/{created['id']}/submit", headers=se)
    np_headers = await _login(client, "np-prof@e.com", "np_admin")
    me = (await client.get("/api/v1/auth/me", headers=np_headers)).json()
    await repo.link_admin(db_session, me["id"], np.id)
    approved = await client.post(
        f"/api/v1/np/approvals/{created['id']}/approve", headers=np_headers
    )
    assert approved.status_code == 200

    resp = await client.get("/api/v1/nonprofits/ocean-conservancy")
    assert resp.status_code == 200
    body = resp.json()
    assert body["nonprofit"]["slug"] == "ocean-conservancy"
    assert body["nonprofit"]["mission"] == "Protect oceans"
    assert body["nonprofit"]["ein"] == "12-3456789"
    assert body["stats"]["eventsHosted"] == 1
    assert body["stats"]["totalRaised"] >= 0
    assert len(body["events"]) == 1
    assert body["events"][0]["status"] == "Live"
    assert body["events"][0]["key"] == created["key"]


@pytest.mark.asyncio
async def test_get_profile_excludes_unapproved_events(client, db_session):
    np = await _seed(db_session, "Quiet Org", "quiet-org")
    se = await _login(client, "se-quiet@e.com", "se")
    created = (
        await client.post(
            "/api/v1/events",
            headers=se,
            json={"story": "Still in review", "nonprofit_id": np.id},
        )
    ).json()
    await client.post(f"/api/v1/events/{created['id']}/submit", headers=se)

    resp = await client.get("/api/v1/nonprofits/quiet-org")
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["eventsHosted"] == 0
    assert body["events"] == []


@pytest.mark.asyncio
async def test_get_profile_404(client):
    resp = await client.get("/api/v1/nonprofits/missing")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_np_profile_requires_np_admin(client):
    headers = await _login(client, "se@e.com", "se")
    resp = await client.get("/api/v1/np/profile", headers=headers)
    assert resp.status_code == 403


async def _np_admin_with_org(client, db_session, email, slug):
    np = await _seed(db_session, slug.title(), slug, "Community")
    headers = await _login(client, email, "np_admin")
    me = (await client.get("/api/v1/auth/me", headers=headers)).json()
    await repo.link_admin(db_session, me["id"], np.id)
    return headers, np


@pytest.mark.asyncio
async def test_np_profile_get_and_patch(client, db_session):
    headers, _np = await _np_admin_with_org(client, db_session, "npx@e.com", "my-org")

    resp = await client.get("/api/v1/np/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["slug"] == "my-org"
    assert resp.json()["logo_url"] is None

    logo = (await client.post(
        "/api/v1/media", headers=headers,
        json=media_payload("nonprofits/logo1", entity_type="np_logo"),
    )).json()
    resp = await client.patch(
        "/api/v1/np/profile", headers=headers,
        json={"mission": "Updated mission", "logo_media_id": logo["id"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["mission"] == "Updated mission"
    assert body["logo_media_id"] == logo["id"]
    assert body["logo_url"] == logo["secure_url"]  # resolved server-side, not a static asset


@pytest.mark.asyncio
async def test_np_profile_rejects_unknown_or_foreign_media(client, db_session):
    headers, _np = await _np_admin_with_org(client, db_session, "npy@e.com", "org-y")
    other = await _login(client, "uploader@e.com", "se")
    foreign = (await client.post(
        "/api/v1/media", headers=other, json=media_payload("nonprofits/not-mine"),
    )).json()

    ghost = await client.patch("/api/v1/np/profile", headers=headers, json={"cover_media_id": 424242})
    assert ghost.status_code == 400
    stolen = await client.patch("/api/v1/np/profile", headers=headers, json={"cover_media_id": foreign["id"]})
    assert stolen.status_code == 403


@pytest.mark.asyncio
async def test_public_profile_and_list_include_logo_urls(client, db_session):
    headers, np = await _np_admin_with_org(client, db_session, "npz@e.com", "org-z")
    cover = (await client.post("/api/v1/media", headers=headers, json=media_payload("nonprofits/cover1"))).json()
    await client.patch("/api/v1/np/profile", headers=headers, json={"cover_media_id": cover["id"]})

    profile = (await client.get("/api/v1/nonprofits/org-z")).json()
    assert profile["nonprofit"]["cover_url"] == cover["secure_url"]
    listing = (await client.get("/api/v1/nonprofits")).json()
    assert any(i["cover_url"] == cover["secure_url"] for i in listing["items"])
