import pytest

from app.models.category import Category
from app.repositories import nonprofit_repository as np_repo
from tests.helpers import login_as, make_live_event, me_id


@pytest.mark.asyncio
async def test_categories_are_public_and_ordered(client, db_session):
    db_session.add_all([
        Category(name="Health", icon="heart-pulse", color="#D32F2F", sort_order=2),
        Category(name="Animals", icon="paw-print", color="#C2410C", sort_order=1,
                 description="Shelter benefits"),
    ])
    await db_session.commit()
    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 200
    body = resp.json()
    assert [c["name"] for c in body] == ["Animals", "Health"]
    assert body[0]["icon"] == "paw-print" and body[0]["description"] == "Shelter benefits"


@pytest.mark.asyncio
async def test_causes_roll_up_only_categories_with_public_events(client, db_session):
    db_session.add_all([
        Category(name="Animals", sort_order=1), Category(name="Health", sort_order=2),
        Category(name="Arts", sort_order=3),
    ])
    await db_session.commit()
    org = await login_as(client, "causes-org@e.com")
    uid = await me_id(client, org)
    await make_live_event(db_session, organizer_id=uid, category="Animals", raised=300, key="a1",
                          title="#A1", cover_focus="center 30%")
    await make_live_event(db_session, organizer_id=uid, category="Animals", raised=200, key="a2",
                          title="#A2")
    # A draft must not count toward a cause.
    await client.post("/api/v1/events", headers=org, json={"story": "d", "category": "Health"})

    body = (await client.get("/api/v1/causes")).json()
    assert [c["name"] for c in body] == ["Animals"]
    animals = body[0]
    assert animals["event_count"] == 2 and animals["total_raised"] == 500
    assert animals["featured"]["key"] in ("a1", "a2")


@pytest.mark.asyncio
async def test_event_exposes_cover_focus(client, db_session):
    uid = await me_id(client, await login_as(client, "focus@e.com"))
    ev = await make_live_event(db_session, organizer_id=uid, cover_focus="center 18%")
    body = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert body["cover_focus"] == "center 18%"


# ------------------------------------------------------- tickets + check-in

async def _joined(client, db_session, email="tk-guest@e.com"):
    organizer = await login_as(client, "tk-org@e.com")
    ev = await make_live_event(db_session, organizer_id=await me_id(client, organizer))
    guest = await login_as(client, email)
    assert (await client.post(f"/api/v1/events/{ev.id}/join", headers=guest)).status_code == 200
    return organizer, guest, ev


@pytest.mark.asyncio
async def test_joining_issues_a_ticket(client, db_session):
    _org, guest, ev = await _joined(client, db_session)
    ticket = await client.get(f"/api/v1/events/{ev.id}/ticket", headers=guest)
    assert ticket.status_code == 200
    body = ticket.json()
    assert body["code"].startswith("CH-")
    # Stable across calls.
    again = (await client.get(f"/api/v1/events/{ev.id}/ticket", headers=guest)).json()
    assert again["code"] == body["code"]


@pytest.mark.asyncio
async def test_ticket_requires_joining(client, db_session):
    organizer = await login_as(client, "tk2-org@e.com")
    ev = await make_live_event(db_session, organizer_id=await me_id(client, organizer))
    stranger = await login_as(client, "tk2-stranger@e.com")
    assert (await client.get(f"/api/v1/events/{ev.id}/ticket", headers=stranger)).status_code == 403
    assert (await client.get(f"/api/v1/events/{ev.id}/ticket")).status_code == 401


@pytest.mark.asyncio
async def test_scanning_a_ticket_checks_in_once(client, db_session):
    organizer, guest, ev = await _joined(client, db_session)
    code = (await client.get(f"/api/v1/events/{ev.id}/ticket", headers=guest)).json()["code"]

    first = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=organizer, json={"code": code})
    assert first.status_code == 201
    assert first.json()["ticket_code"] == code
    assert first.json()["name"]

    dup = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=organizer, json={"code": code.lower()})
    assert dup.status_code == 409
    assert dup.json()["error"]["code"] == "already_checked_in"

    listing = (await client.get(f"/api/v1/events/{ev.id}/attendees", headers=organizer)).json()
    assert len(listing) == 1


@pytest.mark.asyncio
async def test_unknown_ticket_and_wrong_event_rejected(client, db_session):
    organizer, guest, ev = await _joined(client, db_session)
    other = await make_live_event(db_session, organizer_id=await me_id(client, organizer))
    code = (await client.get(f"/api/v1/events/{ev.id}/ticket", headers=guest)).json()["code"]
    bad = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=organizer, json={"code": "CH-NOPE"})
    assert bad.status_code == 404
    wrong_event = await client.post(f"/api/v1/events/{other.id}/checkin", headers=organizer, json={"code": code})
    assert wrong_event.status_code == 404


@pytest.mark.asyncio
async def test_only_staff_can_check_in(client, db_session):
    _org, guest, ev = await _joined(client, db_session)
    code = (await client.get(f"/api/v1/events/{ev.id}/ticket", headers=guest)).json()["code"]
    resp = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=guest, json={"code": code})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_walk_in_checkin_by_name_still_works(client, db_session):
    organizer, _guest, ev = await _joined(client, db_session)
    ok = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=organizer, json={"name": "Walk In"})
    assert ok.status_code == 201 and ok.json()["ticket_type"] == "Walk-in"
    empty = await client.post(f"/api/v1/events/{ev.id}/checkin", headers=organizer, json={})
    assert empty.status_code == 422


@pytest.mark.asyncio
async def test_accepting_invite_creates_verification_review_item(client, db_session):
    admin = await login_as(client, "rv-admin@e.com", "platform_admin")
    created = (
        await client.post("/api/v1/admin/nonprofits/invite", headers=admin,
                          json={"name": "Review Me NP", "ein": "11-1111111",
                                "admin_email": "boss@reviewme.org"})
    ).json()
    token = created["invite"]["invite_url"].split("token=")[1]
    await client.post("/api/v1/auth/accept-invite",
                      json={"token": token, "name": "Boss", "password": "Passw0rd!"})
    reviews = (await client.get("/api/v1/admin/review", headers=admin)).json()
    item = next(r for r in reviews if r["title"] == "Verify Review Me NP")
    assert item["status"] == "New" and item["type"] == "Nonprofit Verification"


# ------------------------------------------------------------ organizer profile

@pytest.mark.asyncio
async def test_public_organizer_profile_shows_only_public_fields(client):
    headers = await login_as(client, "orgprof@e.com")
    uid = await me_id(client, headers)
    await client.patch("/api/v1/me/profile", headers=headers,
                       json={"name": "Jamie Rivera", "bio": "I run charity 5Ks.", "city": "Austin, TX",
                             "causes": ["Health", "Sports"]})
    resp = await client.get(f"/api/v1/organizers/{uid}")  # no auth needed
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Jamie Rivera" and body["city"] == "Austin, TX"
    assert body["bio"] == "I run charity 5Ks." and body["causes"] == ["Health", "Sports"]
    assert "email" not in body and "password_hash" not in body and "phone" not in body


@pytest.mark.asyncio
async def test_organizer_profile_404_for_guests_admins_and_unknown(client, make_user):
    guest = await make_user(role="guest_lead", email="g404@e.com", password=None)
    admin = await make_user(role="platform_admin", email="a404@e.com")
    for uid in (guest.id, admin.id, 999999):
        assert (await client.get(f"/api/v1/organizers/{uid}")).status_code == 404


@pytest.mark.asyncio
async def test_avatar_must_be_own_uploaded_image(client):
    from tests.helpers import media_payload

    mine = await login_as(client, "av-mine@e.com")
    other = await login_as(client, "av-other@e.com")
    theirs = (await client.post("/api/v1/media", headers=other, json=media_payload("avatars/theirs"))).json()
    ok = (await client.post("/api/v1/media", headers=mine, json=media_payload("avatars/mine"))).json()

    assert (await client.patch("/api/v1/me/profile", headers=mine, json={"avatar_media_id": 424242})).status_code == 400
    assert (await client.patch("/api/v1/me/profile", headers=mine, json={"avatar_media_id": theirs["id"]})).status_code == 403
    assert (await client.patch("/api/v1/me/profile", headers=mine, json={"avatar_media_id": ok["id"]})).status_code == 200
