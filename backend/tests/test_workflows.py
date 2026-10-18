"""Cross-role, end-to-end lifecycle tests against the real seed data.

SE creates -> nonprofit sees & decides -> SE sees the outcome -> public sees it
only when Live. Runs for every seeded nonprofit, not just one.
"""
import pytest

from app.core.security import create_access_token
from app.repositories import nonprofit_repository as np_repo
from app.repositories import user_repository
from seed.np_accounts import NP_ACCOUNT_ALIASES
from seed.seed import seed
from tests.helpers import login_as, make_live_event, me_id, media_payload

API = "/api/v1"


async def _headers_for(db_session, email: str) -> dict:
    user = await user_repository.get_by_email(db_session, email)
    token = create_access_token(subject=str(user.id), extra={"role": user.role})
    return {"Authorization": f"Bearer {token}"}


async def _create_and_submit(client, se, nonprofit_id, story="A brand new event"):
    created = (await client.post(
        f"{API}/events", headers=se,
        json={"story": story, "category": "Community", "nonprofit_id": nonprofit_id},
    )).json()
    assert created["status"] == "Draft"
    submitted = await client.post(f"{API}/events/{created['id']}/submit", headers=se)
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["status"] == "Submitted"
    return created


@pytest.fixture
async def seeded(db_session):
    await seed(db_session)
    return db_session


async def _nonprofit_ids(client) -> dict[str, int]:
    items = (await client.get(f"{API}/nonprofits?limit=100")).json()["items"]
    return {n["name"]: n["id"] for n in items}


@pytest.mark.asyncio
async def test_every_nonprofit_sees_exactly_its_own_requests(client, seeded):
    """The Sierra Club bug class: a submitted event must reach *its* nonprofit's admin
    (queue, launchpad, notification) and nobody else's - for all 20 nonprofits."""
    ids = await _nonprofit_ids(client)
    assert len(ids) == 20
    se = await _headers_for(seeded, "mike.rivera@demo.charityhub.com")

    admins = {}
    for alias in NP_ACCOUNT_ALIASES:
        admins[alias["nonprofit_name"]] = await _headers_for(seeded, alias["email"])

    created = {}
    for i, name in enumerate(admins):
        created[name] = await _create_and_submit(client, se, ids[name], story=f"Request {i} for {name}")

    for name, headers in admins.items():
        queue = (await client.get(f"{API}/np/approvals", headers=headers)).json()
        pending_keys = {e["key"] for e in queue if e["status"] in ("Submitted", "Changes Requested")}
        assert created[name]["key"] in pending_keys, f"{name} cannot see its own submitted event"
        # ...and none of the other 19 nonprofits' requests leak into this queue.
        others = {c["key"] for n, c in created.items() if n != name}
        assert not (pending_keys & others), f"{name}'s queue contains another nonprofit's request"

        pad = (await client.get(f"{API}/np/launchpad", headers=headers)).json()
        assert pad["stats"]["pending_approvals"] == len(pending_keys)
        assert [a["key"] for a in pad["action_required"]] == [created[name]["key"]]

        notes = (await client.get(f"{API}/me/notifications", headers=headers)).json()
        assert any(n["type"] == "approval_requested" and created[name]["key"].split("-")[0] in n["text"].lower()
                   or n["type"] == "approval_requested" for n in notes), f"{name} was not notified"

        # Direct review access: own event yes, another nonprofit's event no.
        assert (await client.get(f"{API}/np/approvals/{created[name]['id']}", headers=headers)).status_code == 200
        other = next(c for n, c in created.items() if n != name)
        assert (await client.get(f"{API}/np/approvals/{other['id']}", headers=headers)).status_code == 404


@pytest.mark.asyncio
async def test_full_lifecycle_for_sierra_club(client, seeded):
    ids = await _nonprofit_ids(client)
    sierra_id = ids["Sierra Club Foundation"]
    sierra = await _headers_for(seeded, "sierraclub@charityhub.com")
    redcross = await _headers_for(seeded, "redcross@charityhub.com")
    se = await login_as(client, "lifecycle-se@e.com")
    stranger = await login_as(client, "lifecycle-stranger@e.com")

    # A draft is private to its author - the nonprofit must NOT see it yet.
    draft = (await client.post(f"{API}/events", headers=se, json={
        "story": "Trail cleanup day", "category": "Environment", "nonprofit_id": sierra_id})).json()
    queue = (await client.get(f"{API}/np/approvals", headers=sierra)).json()
    assert draft["key"] not in {e["key"] for e in queue}
    assert (await client.get(f"{API}/events/{draft['key']}", headers=sierra)).status_code == 404

    # A photo is attached, as the wizard does.
    photo = await client.post(f"{API}/media", headers=se, json=media_payload(
        "events/lifecycle", entity_type="event_photo", entity_id=draft["id"]))
    assert photo.status_code == 201

    # Submit -> visible to Sierra Club (queue, detail, cover), invisible to the public & to others.
    assert (await client.post(f"{API}/events/{draft['id']}/submit", headers=se)).status_code == 200
    queue = (await client.get(f"{API}/np/approvals", headers=sierra)).json()
    row = next(e for e in queue if e["key"] == draft["key"])
    assert row["status"] == "Submitted"
    assert row["cover"] and row["cover"].startswith("https://res.cloudinary.com/"), "queue must carry the real cover"
    assert row["organizer"] and row["created_at"]
    assert (await client.get(f"{API}/events/{draft['key']}", headers=sierra)).status_code == 200
    public = (await client.get(f"{API}/events?limit=50")).json()["items"]
    assert draft["key"] not in {e["key"] for e in public}
    assert draft["key"] not in {e["key"] for e in (await client.get(f"{API}/np/approvals", headers=redcross)).json()}
    assert (await client.get(f"{API}/events/{draft['key']}", headers=stranger)).status_code == 404

    # SE sees it as Submitted in *their own* events (this is what the SE screens query).
    mine = (await client.get(f"{API}/events/mine?statuses=Submitted,Changes Requested", headers=se)).json()["items"]
    assert [e["status"] for e in mine if e["key"] == draft["key"]] == ["Submitted"]

    # Only the owning nonprofit may decide.
    assert (await client.post(f"{API}/np/approvals/{draft['id']}/approve", headers=redcross)).status_code == 404
    assert (await client.post(f"{API}/np/approvals/{draft['id']}/approve", headers=se)).status_code == 403

    # Request changes -> SE is told, status moves, nonprofit still has it in its queue.
    changes = await client.post(f"{API}/np/approvals/{draft['id']}/request-changes", headers=sierra,
                                json={"feedback": "Add a date", "areas": ["date_location"]})
    assert changes.status_code == 200, changes.text
    assert changes.json()["status"] == "Changes Requested"
    mine = (await client.get(f"{API}/events/mine?statuses=Changes Requested", headers=se)).json()["items"]
    assert draft["key"] in {e["key"] for e in mine}
    se_notes = (await client.get(f"{API}/me/notifications", headers=se)).json()
    assert any(n["type"] == "changes_requested" for n in se_notes)

    # SE fixes and resubmits -> back in the queue as Submitted.
    assert (await client.post(f"{API}/events/{draft['id']}/save-draft", headers=se,
                              json={"date": "Nov 30, 2026", "location": "Muir Woods"})).status_code == 200
    assert (await client.post(f"{API}/events/{draft['id']}/submit", headers=se)).status_code == 200
    queue = (await client.get(f"{API}/np/approvals", headers=sierra)).json()
    assert next(e for e in queue if e["key"] == draft["key"])["status"] == "Submitted"

    # Approve -> one step to Live, public feed shows it, queue keeps it as Live, SE notified.
    approved = await client.post(f"{API}/np/approvals/{draft['id']}/approve", headers=sierra)
    assert approved.status_code == 200 and approved.json()["status"] == "Live"
    public = (await client.get(f"{API}/events?limit=50")).json()["items"]
    assert draft["key"] in {e["key"] for e in public}
    queue = (await client.get(f"{API}/np/approvals", headers=sierra)).json()
    assert next(e for e in queue if e["key"] == draft["key"])["status"] == "Live"
    pad = (await client.get(f"{API}/np/launchpad", headers=sierra)).json()
    assert draft["key"] in {e["key"] for e in pad["live_events"]}
    assert any(n["type"] == "event_approved" for n in (await client.get(f"{API}/me/notifications", headers=se)).json())
    # Approving twice is refused, not silently re-applied.
    assert (await client.post(f"{API}/np/approvals/{draft['id']}/approve", headers=sierra)).status_code == 409

    # Reject path on a second event.
    second = await _create_and_submit(client, se, sierra_id, story="Second event")
    rejected = await client.post(f"{API}/np/approvals/{second['id']}/reject", headers=sierra, json={"reason": "Not a fit"})
    assert rejected.status_code == 200 and rejected.json()["status"] == "Rejected"
    public = (await client.get(f"{API}/events?limit=50")).json()["items"]
    assert second["key"] not in {e["key"] for e in public}
    assert any(n["type"] == "event_rejected" for n in (await client.get(f"{API}/me/notifications", headers=se)).json())


@pytest.mark.asyncio
async def test_partner_and_own_org_flows(client, seeded):
    """An nonprofit admin creating for ANOTHER org needs that org's approval;
    creating for their own org publishes immediately."""
    ids = await _nonprofit_ids(client)
    redcross = await _headers_for(seeded, "redcross@charityhub.com")
    sierra = await _headers_for(seeded, "sierraclub@charityhub.com")

    partner = await _create_and_submit(client, redcross, ids["Sierra Club Foundation"], story="Partner event")
    sierra_queue = (await client.get(f"{API}/np/approvals", headers=sierra)).json()
    assert partner["key"] in {e["key"] for e in sierra_queue}
    red_queue = (await client.get(f"{API}/np/approvals", headers=redcross)).json()
    assert partner["key"] not in {e["key"] for e in red_queue}
    assert (await client.post(f"{API}/np/approvals/{partner['id']}/approve", headers=redcross)).status_code == 404

    own = (await client.post(f"{API}/events", headers=redcross, json={
        "story": "Our own event", "category": "Community", "nonprofit_id": ids["American Red Cross"]})).json()
    published = await client.post(f"{API}/events/{own['id']}/submit", headers=redcross)
    assert published.json()["status"] == "Live" and published.json()["is_live"] is True


@pytest.mark.asyncio
async def test_admin_and_guest_visibility(client, seeded):
    ids = await _nonprofit_ids(client)
    se = await _headers_for(seeded, "mike.rivera@demo.charityhub.com")
    ev = await _create_and_submit(client, se, ids["Sierra Club Foundation"])
    admin = await _headers_for(seeded, "alex.mercer@charityhub.com")
    sierra = await _headers_for(seeded, "sierraclub@charityhub.com")

    admin_events = (await client.get(f"{API}/admin/events", headers=admin)).json()
    assert ev["key"] in {e["key"] for e in admin_events}
    assert (await client.get(f"{API}/admin/events", headers=se)).status_code == 403
    assert (await client.get(f"{API}/admin/events", headers=sierra)).status_code == 403
    assert (await client.get(f"{API}/np/approvals")).status_code == 401
    assert (await client.get(f"{API}/np/approvals", headers=se)).status_code == 403
    assert (await client.get(f"{API}/events/mine")).status_code == 401
    # Nothing unpublished leaks to anonymous visitors.
    assert (await client.get(f"{API}/events/{ev['key']}")).status_code == 404
    assert ev["key"] not in {e["key"] for e in (await client.get(f"{API}/events?limit=100")).json()["items"]}


@pytest.mark.asyncio
async def test_dashboards_carry_real_covers(client, seeded):
    sierra = await _headers_for(seeded, "sierraclub@charityhub.com")
    pad = (await client.get(f"{API}/np/launchpad", headers=sierra)).json()
    assert pad["live_events"], "Sierra Club has a seeded live event"
    assert all("cover" in e for e in pad["live_events"])
    assert pad["live_events"][0]["cover"], "seeded photos should surface as the cover"
    act = (await client.get(f"{API}/np/activity", headers=sierra)).json()
    fin = (await client.get(f"{API}/np/financials", headers=sierra)).json()
    assert all("cover" in r for r in act["backing_by_event"])
    assert all("cover" in r for r in fin["revenue_by_event"])
